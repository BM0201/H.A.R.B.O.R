import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { scanPreview, scanPreviewSchema } from "@/contexts/receiving";
import { RECEIVING_CAPS } from "@/modules/receiving/http-helpers";

/**
 * HARBOR PASO S.2 — Vista previa del escáner. Normaliza el tracking y parsea la
 * etiqueta SIN tocar la base: el operador ve a quién apunta antes de confirmar.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, RECEIVING_CAPS.RECEIVE)) {
      return fail("FORBIDDEN", "Sin permiso de recepcion", 403);
    }

    const parsed = scanPreviewSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    return ok(scanPreview(parsed.data));
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
