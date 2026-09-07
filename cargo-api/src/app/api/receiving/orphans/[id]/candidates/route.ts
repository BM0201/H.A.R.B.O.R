import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { receiving } from "@/contexts/receiving";
import { RECEIVING_CAPS } from "@/modules/receiving/http-helpers";

/**
 * HARBOR PASO S.2 — Candidatos para un huérfano. El ranking por nombre SÓLO
 * ordena una lista para que un humano elija — nunca asigna.
 */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);

    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, RECEIVING_CAPS.RECEIVE)) {
      return fail("FORBIDDEN", "Sin permiso de recepcion", 403);
    }

    const { id } = await context.params;
    return ok(await receiving.getOrphanCandidates(id));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PACKAGE_NOT_FOUND")) {
      return fail("NOT_FOUND", "Paquete no encontrado", 404);
    }
    if (error instanceof Error && error.message.startsWith("PACKAGE_NOT_ORPHAN")) {
      return fail("CONFLICT", "El paquete ya tiene dueno", 409);
    }
    return toHttpErrorResponse(error);
  }
}
