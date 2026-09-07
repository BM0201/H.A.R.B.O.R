/**
 * HARBOR PASO S.5 — Captura offline en cola.
 *
 * La bodega es una nave metálica: el escaneo funciona sin red y sincroniza
 * después. Offline **NUNCA auto-asigna** — sin red no se consulta la pre-alerta
 * ni se garantiza el `@unique` del tracking (dos devices podrían asignar el
 * mismo paquete). Offline **encola**; al recuperar red el match corre en
 * SERVIDOR y aplica S.2 completo.
 */
import type { ReceivePackageResult, ReceivePackageCommand } from "@/contexts/receiving/application/receive-package";
import type { MatchMode } from "@/contexts/receiving/domain/match-decision";

export type QueuedCapture = {
  offlineClientId: string;
  rawBarcode: string;
  labelRecipientRaw?: string | null;
  declaredMode?: MatchMode | null;
  weightOriginLb?: number | null;
  lengthIn?: number | null;
  widthIn?: number | null;
  heightIn?: number | null;
  weightSource?: "SCALE" | "MANUAL";
  photoKey?: string | null;
  capturedAt: string; // ISO — cuándo se escaneó en el device
};

export type PendingQueueItem = {
  id: string;
  offlineClientId: string;
  rawBarcode: string;
  labelRecipientRaw: string | null;
  declaredMode: MatchMode | null;
  weightOriginLb: number | null;
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
  weightSource: "SCALE" | "MANUAL" | null;
  originBranchId: string | null;
  capturedByUserId: string;
};

export type ReceivingQueuePort = {
  enqueue(input: {
    captures: QueuedCapture[];
    capturedByUserId: string;
    originBranchId: string | null;
  }): Promise<{ accepted: number; duplicates: number }>;
  claimPending(limit: number): Promise<PendingQueueItem[]>;
  markResult(
    id: string,
    result: { status: "MATCHED" | "ORPHANED" | "FAILED"; packageId: string | null; error: string | null },
  ): Promise<void>;
};

export type ProcessQueueResult = {
  claimed: number;
  matched: number;
  orphaned: number;
  failed: number;
};

export function createProcessReceivingQueue(deps: {
  queue: ReceivingQueuePort;
  receivePackage: (cmd: ReceivePackageCommand) => Promise<ReceivePackageResult>;
}) {
  return async function processReceivingQueue(opts: { limit?: number } = {}): Promise<ProcessQueueResult> {
    const items = await deps.queue.claimPending(opts.limit ?? 100);
    const result: ProcessQueueResult = { claimed: items.length, matched: 0, orphaned: 0, failed: 0 };

    for (const item of items) {
      try {
        const outcome = await deps.receivePackage({
          rawBarcode: item.rawBarcode,
          labelRecipientRaw: item.labelRecipientRaw,
          declaredMode: item.declaredMode,
          originBranchId: item.originBranchId,
          receivedByUserId: item.capturedByUserId,
          weightOriginLb: item.weightOriginLb,
          lengthIn: item.lengthIn,
          widthIn: item.widthIn,
          heightIn: item.heightIn,
          weightSource: item.weightSource ?? "MANUAL",
          // offline: si la modalidad discrepa se resuelve luego a mano, no se
          // fuerza en la sincronización.
          overrideModeMismatch: false,
        });
        const status = outcome.outcome === "ORPHAN" ? "ORPHANED" : "MATCHED";
        await deps.queue.markResult(item.id, { status, packageId: outcome.package.id, error: null });
        if (status === "MATCHED") result.matched += 1;
        else result.orphaned += 1;
      } catch (err) {
        await deps.queue.markResult(item.id, {
          status: "FAILED",
          packageId: null,
          error: err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500),
        });
        result.failed += 1;
      }
    }

    return result;
  };
}
