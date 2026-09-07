import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import {
  receiving,
  receivePackageSchema,
  DuplicateTrackingError,
  AmbiguousMatchError,
  ModeMismatchError,
} from "@/contexts/receiving";
import { NoApplicableRateError } from "@/contexts/rating";
import { resolveOriginBranch, canMeasureAt } from "@/modules/receiving/http-helpers";

/**
 * HARBOR PASO S.2 + S.3 — Recibir un paquete: escanear → match por tracking →
 * (pesar). La llave es el tracking normalizado, nunca el nombre.
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    const parsed = receivePackageSchema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());
    const body = parsed.data;

    const branch = resolveOriginBranch(session, body.originBranchId);
    if ("error" in branch) {
      return branch.error === "FORBIDDEN_BRANCH"
        ? fail("FORBIDDEN", "Sin permiso de recepcion en esa sucursal", 403)
        : fail("FORBIDDEN", "No tenes una sucursal de recepcion asignada", 403);
    }

    // Pesar fija el peso facturable — exige `package.measure`, no solo recepción.
    if (body.weightOriginLb != null && !canMeasureAt(session, branch.branchId)) {
      return fail("FORBIDDEN", "Sin permiso para pesar (package.measure)", 403);
    }

    const result = await receiving.receivePackage({
      rawBarcode: body.rawBarcode,
      labelRecipientRaw: body.labelRecipientRaw ?? null,
      declaredMode: body.declaredMode ?? null,
      originBranchId: branch.branchId,
      declaredValue: body.declaredValue ?? null,
      receivedByUserId: session.userId,
      weightOriginLb: body.weightOriginLb ?? null,
      lengthIn: body.lengthIn ?? null,
      widthIn: body.widthIn ?? null,
      heightIn: body.heightIn ?? null,
      weightSource: body.weightSource,
      overrideModeMismatch: body.overrideModeMismatch,
    });

    return ok(result, 201);
  } catch (error) {
    if (error instanceof DuplicateTrackingError) {
      return fail("DUPLICATE_ORIGIN_TRACKING", error.message, 409, { trackingCode: error.existingTrackingCode });
    }
    if (error instanceof AmbiguousMatchError) {
      return fail("AMBIGUOUS_PREALERT_MATCH", error.message, 409, { preAlertIds: error.preAlertIds });
    }
    if (error instanceof ModeMismatchError) {
      return fail("MODE_MISMATCH", error.message, 409, error.detail);
    }
    if (error instanceof NoApplicableRateError) {
      return fail("NO_APPLICABLE_RATE", error.message, 422);
    }
    return toHttpErrorResponse(error);
  }
}
