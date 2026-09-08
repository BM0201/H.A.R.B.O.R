import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { getClientIp } from "@/lib/client-ip";
import { verifyMagicLinkToken } from "@/modules/portal/magic-link";
import { establishPortalSession } from "@/modules/portal/session";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";

export const dynamic = "force-dynamic";

/**
 * HARBOR PASO U.0 — Canje del enlace directo firmado. Token válido → sesión de
 * portal. Token vencido o inválido → `{ ok:false }` (el frontend manda al
 * ingreso normal, NO a un error).
 */
const schema = z.object({ token: z.string().min(10).max(4096) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return ok({ authenticated: false });

  const result = verifyMagicLinkToken(parsed.data.token);
  if (!result.valid) {
    return ok({ authenticated: false, reason: result.reason });
  }

  const customer = await prisma.customer.findUnique({
    where: { id: result.customerId },
    select: { id: true, code: true, isActive: true },
  });
  if (!customer || !customer.isActive) return ok({ authenticated: false, reason: "GONE" });

  await establishPortalSession(customer.id, {
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });
  await logAuditEvent({
    module: "portal",
    action: "PORTAL_SESSION_ESTABLISHED",
    entityType: "Customer",
    entityId: customer.id,
    metadataJson: { via: "MAGIC_LINK" },
  });

  return ok({ authenticated: true, redirectTo: "/portal/casillero" });
}

export function GET() {
  return fail("METHOD_NOT_ALLOWED", "Usa POST", 405);
}
