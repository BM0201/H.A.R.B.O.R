import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { receiving, assignOrphanSchema } from "@/contexts/receiving";
import { RECEIVING_CAPS } from "@/modules/receiving/http-helpers";

/** HARBOR PASO S.2 — Asignación manual de un huérfano, auditada. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, RECEIVING_CAPS.RECEIVE)) {
      return fail("FORBIDDEN", "Sin permiso de recepcion", 403);
    }

    const { id } = await context.params;
    const parsed = assignOrphanSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    const pkg = await receiving.assignOrphan({
      packageId: id,
      customerId: parsed.data.customerId,
      mode: parsed.data.mode,
      actorUserId: session.userId,
      note: parsed.data.note ?? null,
    });
    return ok(pkg);
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
