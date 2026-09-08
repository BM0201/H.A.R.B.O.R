import { z } from "zod";
import { ok, fail } from "@/lib/api/response";
import { getClientIp } from "@/lib/client-ip";
import { requestPortalCode } from "@/modules/portal/service";

export const dynamic = "force-dynamic";

/**
 * HARBOR PASO U.0 — Solicitud del código de un solo uso.
 * Respuesta y latencia IDÉNTICAS exista o no el casillero.
 */
const schema = z.object({ casillero: z.string().min(3).max(32) });

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      // Incluso una entrada inválida obtiene la respuesta neutra.
      return ok({ message: "Si el casillero existe, enviamos un codigo." });
    }
    await requestPortalCode({ casilleroCode: parsed.data.casillero, ip: getClientIp(request) });
    return ok({ message: "Si el casillero existe, enviamos un codigo." });
  } catch {
    // Nunca filtrar la causa — respuesta neutra siempre.
    return ok({ message: "Si el casillero existe, enviamos un codigo." });
  }
}

export function GET() {
  return fail("METHOD_NOT_ALLOWED", "Usa POST", 405);
}
