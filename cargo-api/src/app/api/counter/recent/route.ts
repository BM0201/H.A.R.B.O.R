import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { recentCounterVisits } from "@/modules/counter/service";
import { resolveCounterBranch } from "@/modules/counter/http";

/** HARBOR PASO U.2 — Casilleros atendidos recientemente en esta sucursal. */
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    const branch = resolveCounterBranch(session, new URL(request.url).searchParams.get("branchId"));
    if ("error" in branch) return fail("FORBIDDEN", "Sin sucursal de mostrador", 403);
    return ok(await recentCounterVisits(branch.branchId));
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
