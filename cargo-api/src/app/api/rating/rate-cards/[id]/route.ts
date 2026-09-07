import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal, isOwner } from "@/modules/rbac/guards";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { updateRateCard, updateRateCardSchema } from "@/contexts/rating";

/** HARBOR PASO S.3 — Editar una tarifa. `rate.edit`; cambio a AuditLog con el valor anterior. */
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    const canEdit =
      isPrivilegedGlobal(session) ||
      isOwner(session) ||
      hasCapabilityInAnyAssignedBranch(session, CAPABILITIES.RATE_EDIT);
    if (!canEdit) return fail("FORBIDDEN", "Sin permiso para editar tarifas (rate.edit)", 403);

    const { id } = await context.params;
    const parsed = updateRateCardSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    return ok(await updateRateCard(id, parsed.data, session.userId));
  } catch (error) {
    if (error instanceof Error && /No\w*Record|not found/i.test(error.message)) {
      return fail("NOT_FOUND", "Tarifa no encontrada", 404);
    }
    return toHttpErrorResponse(error);
  }
}
