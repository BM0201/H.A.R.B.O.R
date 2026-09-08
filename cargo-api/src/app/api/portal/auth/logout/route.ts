import { ok } from "@/lib/api/response";
import { clearPortalSession } from "@/modules/portal/session";

export const dynamic = "force-dynamic";

/** HARBOR PASO U.0 — Cierre de sesión del portal (revoca la fila + borra la cookie). */
export async function POST() {
  await clearPortalSession();
  return ok({ loggedOut: true });
}
