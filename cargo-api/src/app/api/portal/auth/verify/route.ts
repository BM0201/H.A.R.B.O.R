import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { getClientIp } from "@/lib/client-ip";
import { verifyPortalCode } from "@/modules/portal/service";

export const dynamic = "force-dynamic";

/**
 * HARBOR PASO U.0 — Verificación del código de un solo uso. Éxito → cookie de
 * sesión de portal. Casillero inexistente → mismo `BAD_CODE` (no revela nada).
 */
const schema = z.object({
  casillero: z.string().min(3).max(32),
  code: z.string().regex(/^\d{4,8}$/),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail("BAD_CODE", "Codigo incorrecto o vencido.", 401);

  const result = await verifyPortalCode({
    casilleroCode: parsed.data.casillero,
    code: parsed.data.code,
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (!result.ok) {
    const msg =
      result.reason === "EXPIRED"
        ? "El codigo vencio. Pedi uno nuevo."
        : result.reason === "TOO_MANY_ATTEMPTS"
          ? "Demasiados intentos. Pedi un codigo nuevo."
          : "Codigo incorrecto o vencido.";
    return fail(result.reason, msg, 401);
  }

  return ok({ casillero: result.customerCode, redirectTo: "/portal/casillero" });
}
