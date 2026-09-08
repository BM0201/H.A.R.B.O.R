import { ok, fail } from "@/lib/api/response";
import { toHttpErrorResponse } from "@/lib/http";
import { getPortalSession } from "@/modules/portal/session";
import { getPackageRoute } from "@/modules/portal/queries";

export const dynamic = "force-dynamic";

/**
 * HARBOR PASO U.1 — La ruta ordenada de un paquete, desde el CargoTimelineEntry.
 * El paquete debe ser del cliente de la sesión; un código ajeno da 404 (no
 * revela que existe).
 */
export async function GET(_request: Request, context: { params: Promise<{ codigo: string }> }) {
  try {
    const session = await getPortalSession();
    if (!session) return fail("PORTAL_UNAUTHENTICATED", "Inicia sesion en el portal.", 401);

    const { codigo } = await context.params;
    const route = await getPackageRoute(session.customerId, codigo);
    if (!route) return fail("NOT_FOUND", "Paquete no encontrado.", 404);
    return ok(route);
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
