import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { receiving } from "@/contexts/receiving";
import { RECEIVING_CAPS } from "@/modules/receiving/http-helpers";

/** HARBOR PASO S.2 — Bandeja de huérfanos, con antigüedad visible. */
export async function GET() {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);

    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, RECEIVING_CAPS.RECEIVE)) {
      return fail("FORBIDDEN", "Sin permiso de recepcion", 403);
    }

    return ok(await receiving.listOrphans());
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
