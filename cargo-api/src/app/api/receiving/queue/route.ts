import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { receiving, enqueueSchema } from "@/contexts/receiving";
import { resolveOriginBranch, RECEIVING_CAPS } from "@/modules/receiving/http-helpers";

/**
 * HARBOR PASO S.5 — Sincronización de la cola offline. El device sube lo que
 * capturó sin red; el servidor encola (dedup por `offlineClientId`) y CORRE EL
 * MATCH (S.2 completo). Offline nunca auto-asignó — el match ocurre acá.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, RECEIVING_CAPS.RECEIVE)) {
      return fail("FORBIDDEN", "Sin permiso de recepcion", 403);
    }

    const parsed = enqueueSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    const branch = resolveOriginBranch(session, parsed.data.originBranchId);
    const branchId = "branchId" in branch ? branch.branchId : null;

    const enqueued = await receiving.enqueueCaptures({
      captures: parsed.data.captures,
      capturedByUserId: session.userId,
      originBranchId: branchId,
    });

    const processed = await receiving.processReceivingQueue({ limit: 200 });

    return ok({ enqueued, processed });
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
