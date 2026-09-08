import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated, assertMaster } from "@/modules/auth/access";
import { toHttpErrorResponse } from "@/lib/http";
import { okCached } from "@/lib/api/response";
import { masterLogisticsOverview } from "@/modules/logistics-dashboard/service";

/** HARBOR PASO U.4 — Panorama logístico del Centro Master. */
export async function GET() {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    assertMaster(session);
    return okCached(await masterLogisticsOverview(), 20);
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
