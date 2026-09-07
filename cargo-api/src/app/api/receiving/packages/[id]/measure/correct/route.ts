import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { receiving, measureCorrectionSchema } from "@/contexts/receiving";
import { canCorrectMeasureAt, resolveOriginBranch } from "@/modules/receiving/http-helpers";

/**
 * HARBOR PASO S.3 / PASO R.6 — Corrección del peso post-recepción. NO escribe
 * el número: abre un `ApprovalRequest` (PACKAGE_MEASURE_CORRECTION). Exige
 * `package.measure.correct`, que sólo tienen OWNER/MASTER/SYSTEM_ADMIN.
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    const { id } = await context.params;
    const parsed = measureCorrectionSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    const pkg = await prisma.package.findUnique({ where: { id }, select: { originBranchId: true } });
    if (!pkg) return fail("NOT_FOUND", "Paquete no encontrado", 404);

    if (!canCorrectMeasureAt(session, pkg.originBranchId)) {
      return fail("FORBIDDEN", "Sin permiso para corregir peso (package.measure.correct)", 403);
    }

    const branch = resolveOriginBranch(session, pkg.originBranchId);
    const branchId = "branchId" in branch ? branch.branchId : null;
    if (!branchId) return fail("VALIDATION_ERROR", "El paquete no tiene sucursal de origen para la aprobacion", 400);

    const result = await receiving.requestMeasureCorrection({
      packageId: id,
      actorUserId: session.userId,
      branchId,
      weightOriginLb: parsed.data.weightOriginLb,
      lengthIn: parsed.data.lengthIn ?? null,
      widthIn: parsed.data.widthIn ?? null,
      heightIn: parsed.data.heightIn ?? null,
      reason: parsed.data.reason,
    });
    return ok(result, result.created ? 201 : 200);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("PACKAGE_NOT_FOUND")) {
      return fail("NOT_FOUND", "Paquete no encontrado", 404);
    }
    if (error instanceof Error && error.message.startsWith("NO_MEASUREMENT_YET")) {
      return fail("CONFLICT", "Usa el pesaje normal, no la correccion", 409);
    }
    return toHttpErrorResponse(error);
  }
}
