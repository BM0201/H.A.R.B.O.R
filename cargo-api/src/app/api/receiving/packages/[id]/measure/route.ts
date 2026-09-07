import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { prisma } from "@/lib/prisma";
import { receiving, measureSchema } from "@/contexts/receiving";
import { NoApplicableRateError } from "@/contexts/rating";
import { canMeasureAt } from "@/modules/receiving/http-helpers";

/**
 * HARBOR PASO S.3 — Pesaje y cotización de un paquete ya recibido.
 * `package.measure` sólo lo tiene WAREHOUSE_ORIGIN (+ OWNER/MASTER/SYS).
 * Negado a WAREHOUSE_DESTINATION y COURIER → 403 (frontera antifraude R.6).
 */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    const { id } = await context.params;
    const parsed = measureSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    const pkg = await prisma.package.findUnique({ where: { id }, select: { originBranchId: true } });
    if (!pkg) return fail("NOT_FOUND", "Paquete no encontrado", 404);

    if (!canMeasureAt(session, pkg.originBranchId)) {
      return fail("FORBIDDEN", "Sin permiso para pesar (package.measure)", 403);
    }

    const result = await receiving.measurePackage({
      packageId: id,
      actorUserId: session.userId,
      weightOriginLb: parsed.data.weightOriginLb,
      lengthIn: parsed.data.lengthIn ?? null,
      widthIn: parsed.data.widthIn ?? null,
      heightIn: parsed.data.heightIn ?? null,
      weightSource: parsed.data.weightSource,
    });
    return ok(result);
  } catch (error) {
    if (error instanceof NoApplicableRateError) return fail("NO_APPLICABLE_RATE", error.message, 422);
    if (error instanceof Error && error.message.startsWith("PACKAGE_NOT_FOUND")) {
      return fail("NOT_FOUND", "Paquete no encontrado", 404);
    }
    if (error instanceof Error && error.message.startsWith("PACKAGE_IS_ORPHAN")) {
      return fail("CONFLICT", "Asigna el dueno antes de cotizar", 409);
    }
    return toHttpErrorResponse(error);
  }
}
