import { z } from "zod";
import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { requireCsrf } from "@/modules/security/csrf";
import { hasCapabilityInAnyAssignedBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { ok, fail } from "@/lib/api/response";
import { counterMagicLink } from "@/modules/counter/service";
import { COUNTER_CAPS } from "@/modules/counter/http";

const schema = z.object({ customerId: z.string().cuid() });

/** HARBOR PASO U.0 — Genera el enlace directo firmado para mandarle al cliente. */
export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);
    if (!isPrivilegedGlobal(session) && !hasCapabilityInAnyAssignedBranch(session, COUNTER_CAPS.VIEW)) {
      return fail("FORBIDDEN", "Sin acceso al mostrador", 403);
    }

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Datos invalidos", 400);

    const origin =
      request.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000";
    return ok(await counterMagicLink(parsed.data.customerId, origin));
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
