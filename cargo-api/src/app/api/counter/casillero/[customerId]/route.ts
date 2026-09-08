import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { counterCasilleroView, recordCounterVisit } from "@/modules/counter/service";
import { resolveCounterBranch } from "@/modules/counter/http";

/** HARBOR PASO U.2 — Vista del casillero en mostrador: disponibles acá, en camino, entregados. */
export async function GET(request: Request, context: { params: Promise<{ customerId: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);

    const branch = resolveCounterBranch(session, new URL(request.url).searchParams.get("branchId"));
    if ("error" in branch) return fail("FORBIDDEN", "Sin sucursal de mostrador", 403);

    const { customerId } = await context.params;
    const view = await counterCasilleroView(customerId, branch.branchId);
    await recordCounterVisit(branch.branchId, customerId, session.userId);
    return ok(view);
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
