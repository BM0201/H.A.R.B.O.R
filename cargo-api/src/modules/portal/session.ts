/**
 * HARBOR PASO U.0 — Sesión del portal del cliente. TOTALMENTE separada de la
 * del staff: cookie distinta (`__Host-cargo_portal_session`), almacenamiento
 * distinto (fila `CustomerSession` revocable), secreto distinto.
 *
 * Un token opaco (32 bytes) va en la cookie; en la base se guarda su SHA-256.
 * Nunca se comparte un helper con `@/modules/auth`.
 */
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const PORTAL_COOKIE = "__Host-cargo_portal_session";
export const PORTAL_SESSION_TTL_HOURS = 24 * 14; // 14 días

export type PortalSession = {
  customerId: string;
  customerUserId: string;
  customerCode: string;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Asegura que exista un `CustomerUser` para el casillero (auth por OTP, sin password real). */
async function ensureCustomerUser(customerId: string): Promise<{ id: string }> {
  const existing = await prisma.customerUser.findUnique({ where: { customerId }, select: { id: true } });
  if (existing) return existing;
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { email: true, code: true } });
  return prisma.customerUser.create({
    data: {
      customerId,
      email: customer.email ?? `${customer.code.toLowerCase()}@casillero.local`,
      // No es una credencial usable: el portal entra por código de un solo uso.
      passwordHash: `otp-only:${randomBytes(24).toString("hex")}`,
      isActive: true,
    },
    select: { id: true },
  });
}

/** Crea la sesión de portal y setea la cookie. Devuelve el token crudo (para tests). */
export async function establishPortalSession(customerId: string, meta?: { ip?: string; userAgent?: string }): Promise<string> {
  const customerUser = await ensureCustomerUser(customerId);
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + PORTAL_SESSION_TTL_HOURS * 3_600_000);

  await prisma.customerSession.create({
    data: {
      customerUserId: customerUser.id,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: meta?.ip ?? null,
      userAgent: meta?.userAgent?.slice(0, 300) ?? null,
    },
  });
  await prisma.customerUser.update({ where: { id: customerUser.id }, data: { lastLoginAt: new Date() } });

  const store = await cookies();
  store.set(PORTAL_COOKIE, token, {
    httpOnly: true,
    secure: true, // __Host- exige Secure siempre (los navegadores lo aceptan sobre http://localhost)
    sameSite: "strict",
    path: "/",
    maxAge: PORTAL_SESSION_TTL_HOURS * 3_600,
  });
  return token;
}

/** Lee y valida la sesión de portal desde la cookie. */
export async function getPortalSession(): Promise<PortalSession | null> {
  const store = await cookies();
  const token = store.get(PORTAL_COOKIE)?.value;
  return token ? resolvePortalToken(token) : null;
}

/** Igual que arriba pero desde un token explícito (route handlers que leen el header/cookie a mano). */
export async function resolvePortalToken(token: string): Promise<PortalSession | null> {
  const row = await prisma.customerSession.findUnique({
    where: { tokenHash: hashToken(token) },
    select: {
      revokedAt: true,
      expiresAt: true,
      customerUser: { select: { id: true, isActive: true, customer: { select: { id: true, code: true, isActive: true } } } },
    },
  });
  if (!row || row.revokedAt || row.expiresAt.getTime() <= Date.now()) return null;
  if (!row.customerUser.isActive || !row.customerUser.customer.isActive) return null;
  return {
    customerId: row.customerUser.customer.id,
    customerUserId: row.customerUser.id,
    customerCode: row.customerUser.customer.code,
  };
}

export async function clearPortalSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(PORTAL_COOKIE)?.value;
  if (token) {
    await prisma.customerSession.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  store.set(PORTAL_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
}

/** Assert helper para los route handlers del portal. */
export function assertPortalSession(session: PortalSession | null): asserts session is PortalSession {
  if (!session) throw new Error("PORTAL_UNAUTHENTICATED");
}
