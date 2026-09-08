import { z } from "zod";
import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { counterHandover } from "@/modules/counter/service";
import { resolveCounterBranch, canHandoverAt } from "@/modules/counter/http";

const schema = z.object({
  customerId: z.string().cuid(),
  packageIds: z.array(z.string().cuid()).min(1).max(50),
  recipientName: z.string().min(2).max(120),
  recipientIdNumber: z.string().min(3).max(40),
  signatureKey: z.string().max(300).nullable().optional(),
  allowUnpaid: z.boolean().optional(),
  note: z.string().max(500).nullable().optional(),
  branchId: z.string().cuid().optional(),
});

/**
 * HARBOR PASO U.2 — Entrega en mostrador. Registra quién retira (nombre +
 * documento + firma). Cobrar y entregar NO se implican: `allowUnpaid` entrega
 * a crédito (exige crédito activo).
 */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    const branch = resolveCounterBranch(session, parsed.data.branchId);
    if ("error" in branch) return fail("FORBIDDEN", "Sin sucursal de mostrador", 403);
    if (!canHandoverAt(session, branch.branchId)) {
      return fail("FORBIDDEN", "Sin permiso de entrega (delivery.handover)", 403);
    }

    const result = await counterHandover({
      customerId: parsed.data.customerId,
      branchId: branch.branchId,
      actorUserId: session.userId,
      packageIds: parsed.data.packageIds,
      recipientName: parsed.data.recipientName,
      recipientIdNumber: parsed.data.recipientIdNumber,
      signatureKey: parsed.data.signatureKey ?? null,
      allowUnpaid: parsed.data.allowUnpaid,
      note: parsed.data.note ?? null,
    });
    return ok(result, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (/PACKAGE_NOT_AVAILABLE|PACKAGE_NOT_HERE|PACKAGE_UNPAID|NO_CREDIT/.test(error.message)) {
        return fail("CONFLICT", error.message, 409);
      }
      if (error.message.startsWith("PACKAGE_NOT_FOUND_OR_NOT_OWNED")) return fail("NOT_FOUND", "Paquete no encontrado", 404);
      if (error.message.startsWith("RECIPIENT_REQUIRED")) return fail("VALIDATION_ERROR", error.message, 400);
    }
    return toHttpErrorResponse(error);
  }
}
