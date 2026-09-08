import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { getFreightInvoice } from "@/contexts/billing";
import { COUNTER_CAPS } from "@/modules/counter/http";

/**
 * HARBOR PASO U.3 — Factura de flete para (re)imprimir. Se lee del snapshot
 * guardado (`PackageQuote` + `SaleOrderLine`), NUNCA de la tarifa vigente:
 * reimprimir tras un cambio de tarifa mantiene el monto original.
 */
export async function GET(_request: Request, context: { params: Promise<{ saleOrderId: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, COUNTER_CAPS.VIEW)) {
      return fail("FORBIDDEN", "Sin acceso al mostrador", 403);
    }
    const { saleOrderId } = await context.params;
    return ok(await getFreightInvoice(saleOrderId));
  } catch (error) {
    if (error instanceof Error && /No\w*Record|not found/i.test(error.message)) {
      return fail("NOT_FOUND", "Factura no encontrada", 404);
    }
    return toHttpErrorResponse(error);
  }
}
