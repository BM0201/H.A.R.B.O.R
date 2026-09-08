import { ok, fail } from "@/lib/api/response";
import { toHttpErrorResponse } from "@/lib/http";
import { getPortalSession } from "@/modules/portal/session";
import { getCasilleroView } from "@/modules/portal/queries";

export const dynamic = "force-dynamic";

/**
 * HARBOR PASO U.1 — Mis paquetes. Scoped por el customerId de la SESIÓN.
 * NUNCA acepta un customerId del request (ni query, ni body, ni header).
 */
export async function GET() {
  try {
    const session = await getPortalSession();
    if (!session) return fail("PORTAL_UNAUTHENTICATED", "Inicia sesion en el portal.", 401);
    return ok(await getCasilleroView(session.customerId));
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
