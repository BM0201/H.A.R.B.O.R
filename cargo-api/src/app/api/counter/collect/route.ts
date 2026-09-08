import { z } from "zod";
import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { collectFreightPayment } from "@/contexts/billing";
import { assertCanCollectPayment, CashSessionRequiredError } from "@/modules/cash-session/payment-collection-guard";
import { resolveCounterBranch } from "@/modules/counter/http";

const schema = z.object({
  saleOrderId: z.string().cuid(),
  method: z.enum(["CASH", "CARD", "TRANSFER"]).default("CASH"),
  branchId: z.string().cuid().optional(),
});

/**
 * HARBOR PASO U.3 / R.3 — Cobrar una factura de flete. Cobrar y entregar son
 * hechos separados. Exige `payment.collect` + sesión de caja abierta a nombre
 * del usuario → si no hay caja, 409 (no 403): es un problema de estado.
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

    const { cashSessionId } = await assertCanCollectPayment(session, branch.branchId);
    if (!cashSessionId) {
      // global privilegiado: no cobra en mostrador (es supervisor, no cajero)
      return fail("FORBIDDEN", "Un supervisor no cobra en el mostrador. Usa un usuario con caja.", 403);
    }

    const result = await collectFreightPayment({
      saleOrderId: parsed.data.saleOrderId,
      cashSessionId,
      actorUserId: session.userId,
      branchId: branch.branchId,
      method: parsed.data.method,
    });
    return ok(result);
  } catch (error) {
    if (error instanceof CashSessionRequiredError) {
      return fail("CASH_SESSION_REQUIRED", "Abrí tu caja para poder cobrar.", 409);
    }
    if (error instanceof Error) {
      if (error.message === "FORBIDDEN_CAPABILITY") return fail("FORBIDDEN", "Sin permiso para cobrar", 403);
      if (error.message === "ALREADY_PAID") return fail("CONFLICT", "Esa factura ya está pagada", 409);
      if (error.message === "ORDER_CANCELLED") return fail("CONFLICT", "Factura anulada", 409);
    }
    return toHttpErrorResponse(error);
  }
}
