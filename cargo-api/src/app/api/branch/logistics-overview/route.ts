import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { canInBranch, getBranchIdsWithCapability, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { okCached, fail } from "@/lib/api/response";
import { branchLogisticsOverview } from "@/modules/logistics-dashboard/service";

/** HARBOR PASO U.4 — Panorama logístico de una sucursal. */
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);

    const provided = new URL(request.url).searchParams.get("branchId");
    let branchId = provided;
    if (branchId) {
      if (!isPrivilegedGlobal(session) && !canInBranch(session, branchId, CAPABILITIES.BRANCH_DASHBOARD_VIEW)) {
        return fail("FORBIDDEN", "Sin acceso a esa sucursal", 403);
      }
    } else {
      branchId = getBranchIdsWithCapability(session, CAPABILITIES.BRANCH_DASHBOARD_VIEW)[0] ?? session.primaryBranchId ?? null;
    }
    if (!branchId) return fail("VALIDATION_ERROR", "Falta la sucursal", 400);

    return okCached(await branchLogisticsOverview(branchId), 20);
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
