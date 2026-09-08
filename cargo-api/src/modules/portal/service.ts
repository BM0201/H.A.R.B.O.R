/**
 * HARBOR PASO U.0 — Solicitud y verificación del código de un solo uso.
 *
 * Reglas duras:
 *  - NUNCA revelar si el casillero existe: misma respuesta, misma latencia.
 *  - Límite de tasa por casillero y por IP.
 *  - Código: 6 dígitos, un solo uso, 10 min, 5 intentos.
 *  - El código se ENCOLA en `CustomerNotification` (el canal real —
 *    WhatsApp/SMS— está fuera de alcance).
 */
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import {
  generateCode,
  hashCode,
  challengeExpiry,
  verifyChallenge,
  MAX_ATTEMPTS,
} from "@/modules/portal/challenge";
import { establishPortalSession } from "@/modules/portal/session";

const REQUESTS_PER_CASILLERO_PER_HOUR = 5;
const REQUESTS_PER_IP_PER_HOUR = 15;
const CONSTANT_TIME_BUDGET_MS = 350;

function ipHash(ip: string | null): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`portal:${ip}`).digest("hex");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)));

async function withConstantTime<T>(fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  await sleep(CONSTANT_TIME_BUDGET_MS - (Date.now() - start));
  return result;
}

/**
 * Siempre devuelve `{ sent: true }` (el mensaje al usuario es idéntico exista o
 * no el casillero). El booleano `actuallySent` es solo para telemetría interna.
 */
export async function requestPortalCode(input: {
  casilleroCode: string;
  ip: string | null;
}): Promise<{ sent: true }> {
  await withConstantTime(async () => {
    const code = (input.casilleroCode ?? "").trim().toUpperCase();
    const iph = ipHash(input.ip);
    const oneHourAgo = new Date(Date.now() - 3_600_000);

    const customer = await prisma.customer.findUnique({
      where: { code },
      select: { id: true, isActive: true, phone: true },
    });

    // Trabajo equivalente aunque no exista: hashear un código dummy.
    const generated = generateCode();
    const codeHashValue = hashCode(generated);

    if (!customer || !customer.isActive) return;

    const [perCasillero, perIp] = await Promise.all([
      prisma.customerAuthChallenge.count({ where: { customerId: customer.id, createdAt: { gte: oneHourAgo } } }),
      iph
        ? prisma.customerAuthChallenge.count({ where: { requestIpHash: iph, createdAt: { gte: oneHourAgo } } })
        : Promise.resolve(0),
    ]);
    if (perCasillero >= REQUESTS_PER_CASILLERO_PER_HOUR || perIp >= REQUESTS_PER_IP_PER_HOUR) {
      await logAuditEvent({
        module: "portal",
        action: "PORTAL_CODE_RATE_LIMITED",
        entityType: "Customer",
        entityId: customer.id,
        metadataJson: { perCasillero, perIp },
      });
      return;
    }

    await prisma.customerAuthChallenge.create({
      data: {
        customerId: customer.id,
        codeHash: codeHashValue,
        requestIpHash: iph,
        expiresAt: challengeExpiry(),
      },
    });

    // Encolar la notificación con el código (canal real fuera de alcance).
    await prisma.customerNotification.create({
      data: {
        customerId: customer.id,
        kind: "PORTAL_CODE",
        body: `Tu codigo para entrar al portal es ${generated}. Vence en 10 minutos. No lo compartas.`,
        dedupeKey: `PORTAL_CODE:${customer.id}:${Date.now()}`,
        channel: customer.phone ? "SMS_PENDING" : "PENDING",
      },
    });

    await logAuditEvent({
      module: "portal",
      action: "PORTAL_CODE_REQUESTED",
      entityType: "Customer",
      entityId: customer.id,
      metadataJson: { hasPhone: Boolean(customer.phone) },
    });
  });

  return { sent: true };
}

export type VerifyResult =
  | { ok: true; customerCode: string }
  | { ok: false; reason: "BAD_CODE" | "EXPIRED" | "TOO_MANY_ATTEMPTS" };

/**
 * Verifica el código. Respuesta y latencia idénticas para casillero inexistente
 * (siempre `BAD_CODE`). Éxito → establece la sesión de portal (cookie).
 */
export async function verifyPortalCode(input: {
  casilleroCode: string;
  code: string;
  ip: string | null;
  userAgent?: string;
}): Promise<VerifyResult> {
  return withConstantTime(async (): Promise<VerifyResult> => {
    const code = (input.casilleroCode ?? "").trim().toUpperCase();
    const customer = await prisma.customer.findUnique({ where: { code }, select: { id: true, code: true, isActive: true } });

    if (!customer || !customer.isActive) {
      return { ok: false, reason: "BAD_CODE" };
    }

    const challenge = await prisma.customerAuthChallenge.findFirst({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, codeHash: true, attempts: true, consumedAt: true, expiresAt: true },
    });

    const outcome = verifyChallenge(challenge, input.code);

    if (!outcome.ok) {
      // Incrementar intentos solo si hay un challenge vivo y el código no cuadra.
      if (challenge && (outcome.reason === "BAD_CODE" || outcome.reason === "TOO_MANY_ATTEMPTS")) {
        await prisma.customerAuthChallenge.update({
          where: { id: challenge.id },
          data: { attempts: { increment: 1 } },
        });
      }
      const reason =
        outcome.reason === "EXPIRED"
          ? "EXPIRED"
          : outcome.reason === "TOO_MANY_ATTEMPTS"
            ? "TOO_MANY_ATTEMPTS"
            : "BAD_CODE";
      return { ok: false, reason };
    }

    // Éxito: consumir el challenge (un solo uso) e invalidar los otros abiertos.
    await prisma.customerAuthChallenge.updateMany({
      where: { customerId: customer.id, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    await establishPortalSession(customer.id, { ip: input.ip ?? undefined, userAgent: input.userAgent });

    await logAuditEvent({
      module: "portal",
      action: "PORTAL_SESSION_ESTABLISHED",
      entityType: "Customer",
      entityId: customer.id,
      metadataJson: { via: "OTP" },
    });

    return { ok: true, customerCode: customer.code };
  });
}

export { MAX_ATTEMPTS };
