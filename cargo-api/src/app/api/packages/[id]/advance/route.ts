import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { advancePackage, nextStatuses, type PackageStatus } from "@/contexts/cargo";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal, canInBranch } from "@/modules/rbac/guards";

/**
 * HARBOR PASO U — Transición MANUAL de etapa de un paquete. Puente mientras no
 * exista la lógica real de consolidación/embarque/aduana/distribución. Exige
 * `package.status.override`. Valida contra la máquina de estados (contexto cargo).
 */
const schema = z.object({
  to: z.enum([
    "RECEIVED_ORIGIN",
    "CONSOLIDATED",
    "IN_TRANSIT",
    "IN_CUSTOMS",
    "AVAILABLE",
    "DELIVERED",
    "RETURNED",
    "LOST",
    "DAMAGED",
  ]),
  destinationBranchId: z.string().cuid().nullable().optional(),
  note: z.string().max(500).nullable().optional(),
});

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    if (
      !isPrivilegedGlobal(session) &&
      !hasCapabilityInAnyAssignedBranch(session, CAPABILITIES.PACKAGE_STATUS_OVERRIDE)
    ) {
      return fail("FORBIDDEN", "Sin permiso para cambiar la etapa de un paquete", 403);
    }

    const { id } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    if (parsed.data.destinationBranchId && !isPrivilegedGlobal(session)) {
      if (!canInBranch(session, parsed.data.destinationBranchId, CAPABILITIES.PACKAGE_STATUS_OVERRIDE)) {
        return fail("FORBIDDEN", "Sin permiso en la sucursal destino", 403);
      }
    }

    const result = await advancePackage({
      packageId: id,
      to: parsed.data.to,
      actorUserId: session.userId,
      destinationBranchId: parsed.data.destinationBranchId ?? null,
      note: parsed.data.note ?? null,
    });
    return ok(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith("PACKAGE_NOT_FOUND")) return fail("NOT_FOUND", "Paquete no encontrado", 404);
      if (error.message.startsWith("ILLEGAL_PACKAGE_TRANSITION")) return fail("CONFLICT", error.message, 409);
      if (error.message.startsWith("DESTINATION_BRANCH_REQUIRED")) return fail("VALIDATION_ERROR", error.message, 400);
      if (error.message.startsWith("PACKAGE_HAS_NO_OWNER")) return fail("CONFLICT", error.message, 409);
      if (error.message.startsWith("PACKAGE_IN_TERMINAL_STATE")) return fail("CONFLICT", error.message, 409);
    }
    return toHttpErrorResponse(error);
  }
}

/** GET → estados a los que este paquete puede pasar ahora (para la UI). */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    const { id } = await context.params;
    const pkg = await prisma.package.findUnique({ where: { id }, select: { status: true } });
    if (!pkg) return fail("NOT_FOUND", "Paquete no encontrado", 404);
    return ok({ status: pkg.status, next: nextStatuses(pkg.status as PackageStatus) });
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
