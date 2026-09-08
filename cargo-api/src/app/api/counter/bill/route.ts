import { z } from "zod";
import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { billFreightForPickup } from "@/contexts/billing";
import { resolveCounterBranch } from "@/modules/counter/http";

const schema = z.object({
  customerId: z.string().cuid(),
  packageIds: z.array(z.string().cuid()).min(1).max(50),
  branchId: z.string().cuid().optional(),
});

/** HARBOR PASO U.3 — Factura de flete de N paquetes (snapshot de cotización). */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400, parsed.error.flatten());

    const branch = resolveCounterBranch(session, parsed.data.branchId);
    if ("error" in branch) return fail("FORBIDDEN", "Sin sucursal de mostrador", 403);

    const result = await billFreightForPickup({
      customerId: parsed.data.customerId,
      branchId: branch.branchId,
      actorUserId: session.userId,
      packageIds: parsed.data.packageIds,
    });
    return ok(result, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (/PACKAGE_NOT_AVAILABLE|PACKAGE_NOT_HERE|PACKAGE_ALREADY_BILLED|PACKAGE_NOT_QUOTED|MIXED_CURRENCY/.test(error.message)) {
        return fail("CONFLICT", error.message, 409);
      }
      if (error.message.startsWith("PACKAGE_NOT_FOUND_OR_NOT_OWNED")) return fail("NOT_FOUND", "Paquete no encontrado", 404);
    }
    return toHttpErrorResponse(error);
  }
}
