import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal, isOwner } from "@/modules/rbac/guards";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import {
  listRateCards,
  createRateCard,
  createRateCardSchema,
  listRateCardsQuerySchema,
} from "@/contexts/rating";

function canView(session: Parameters<typeof hasCapabilityInAnyAssignedBranch>[0]) {
  return isPrivilegedGlobal(session) || hasCapabilityInAnyAssignedBranch(session, CAPABILITIES.RATE_VIEW);
}
function canEdit(session: Parameters<typeof hasCapabilityInAnyAssignedBranch>[0]) {
  return (
    isPrivilegedGlobal(session) ||
    isOwner(session) ||
    hasCapabilityInAnyAssignedBranch(session, CAPABILITIES.RATE_EDIT)
  );
}

/** HARBOR PASO S.3 — Tarifario. Ver: `rate.view`. Editar: `rate.edit`. */
export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    if (!canView(session)) return fail("FORBIDDEN", "Sin permiso para ver tarifas", 403);

    const { searchParams } = new URL(request.url);
    const parsed = listRateCardsQuerySchema.safeParse({
      mode: searchParams.get("mode") ?? undefined,
      customerId: searchParams.get("customerId") ?? undefined,
      includeInactive: searchParams.get("includeInactive") ?? undefined,
    });
    if (!parsed.success) return fail("VALIDATION_ERROR", "Query invalida", 400, parsed.error.flatten());

    return ok(await listRateCards(parsed.data));
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);
    if (!canEdit(session)) return fail("FORBIDDEN", "Sin permiso para editar tarifas (rate.edit)", 403);

    const parsed = createRateCardSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    return ok(await createRateCard(parsed.data, session.userId), 201);
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
