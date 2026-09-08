import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { counterSearch } from "@/modules/counter/service";
import { COUNTER_CAPS } from "@/modules/counter/http";

/** HARBOR PASO U.2 — Un solo campo: nombre, tracking o casillero. Resuelve por forma. */
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, COUNTER_CAPS.VIEW)) {
      return fail("FORBIDDEN", "Sin acceso al mostrador", 403);
    }
    const q = new URL(request.url).searchParams.get("q") ?? "";
    return ok(await counterSearch(q));
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
