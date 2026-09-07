import { NextResponse } from "next/server";
import { fail } from "@/lib/api/response";
import { toHttpErrorResponse } from "@/lib/http";
import { timingSafeEqualStrings } from "@/lib/timing-safe-compare";
import { getCurrentSession } from "@/modules/auth/service";
import { isMaster } from "@/modules/rbac/guards";
import { dispatchPendingOutbox } from "@/modules/outbox/dispatcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * HARBOR PASO S.4 — Despachador del outbox (ADR-0006). Corre por cron
 * (vercel.json). Entrega at-least-once los `OutboxEvent` sin procesar a sus
 * consumidores idempotentes. También lo puede disparar Master a mano (debug).
 */
async function authorize(request: Request): Promise<void> {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (secret && authorization && timingSafeEqualStrings(authorization, `Bearer ${secret}`)) return;

  const session = await getCurrentSession();
  if (session && isMaster(session)) return;
  throw new Error("CRON_UNAUTHORIZED");
}

async function handle(request: Request) {
  try {
    await authorize(request);
    const url = new URL(request.url);
    const batchSize = Number(url.searchParams.get("batch") ?? "100");
    const result = await dispatchPendingOutbox({ batchSize: Number.isFinite(batchSize) ? batchSize : 100 });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof Error && error.message === "CRON_UNAUTHORIZED") {
      return fail("UNAUTHORIZED", "Despachador no autorizado.", 401);
    }
    return toHttpErrorResponse(error);
  }
}

export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
