/**
 * Contexto `receiving` — API pública. Recepción e identificación en la bodega
 * de origen (Doral). HARBOR PASO S, primer vertical slice del §12 paso 9.
 *
 * Este índice es la RAÍZ DE COMPOSICIÓN: inyecta los adaptadores Prisma
 * (`infrastructure/`) y el cotizador del contexto `rating` en los casos de uso
 * (`application/`). Los route handlers de `src/app/api/receiving/**` sólo llaman
 * a las funciones que se exportan acá.
 */
import { makeQuoter } from "@/contexts/rating";
import { createPrismaReceivingRepository } from "@/contexts/receiving/infrastructure/prisma-receiving-repository";
import { createPrismaReceivingQueue } from "@/contexts/receiving/infrastructure/prisma-receiving-queue";
import { createReceivePackage } from "@/contexts/receiving/application/receive-package";
import { createMeasurePackage, createRequestMeasureCorrection } from "@/contexts/receiving/application/measure-package";
import { createGetOrphanCandidates, createAssignOrphan } from "@/contexts/receiving/application/assign-orphan";
import { createProcessReceivingQueue } from "@/contexts/receiving/application/receiving-queue";
import { normalizeCarrierTracking } from "@/contexts/receiving/domain/tracking-normalization";
import { parseLabelRecipient } from "@/contexts/receiving/domain/label-parse";

function wire() {
  const repo = createPrismaReceivingRepository();
  const queue = createPrismaReceivingQueue();
  const quoter = makeQuoter();

  const receivePackage = createReceivePackage({ repo, quoter });

  return {
    receivePackage,
    measurePackage: createMeasurePackage({ repo, quoter }),
    requestMeasureCorrection: createRequestMeasureCorrection({ repo }),
    getOrphanCandidates: createGetOrphanCandidates({ repo }),
    assignOrphan: createAssignOrphan({ repo }),
    listOrphans: () => repo.listOrphans(),
    enqueueCaptures: queue.enqueue.bind(queue),
    processReceivingQueue: createProcessReceivingQueue({ queue, receivePackage }),
  };
}

let _wired: ReturnType<typeof wire> | null = null;
function app() {
  if (!_wired) _wired = wire();
  return _wired;
}

export const receiving = {
  receivePackage: (cmd: Parameters<ReturnType<typeof wire>["receivePackage"]>[0]) => app().receivePackage(cmd),
  measurePackage: (cmd: Parameters<ReturnType<typeof wire>["measurePackage"]>[0]) => app().measurePackage(cmd),
  requestMeasureCorrection: (cmd: Parameters<ReturnType<typeof wire>["requestMeasureCorrection"]>[0]) =>
    app().requestMeasureCorrection(cmd),
  getOrphanCandidates: (packageId: string) => app().getOrphanCandidates(packageId),
  assignOrphan: (cmd: Parameters<ReturnType<typeof wire>["assignOrphan"]>[0]) => app().assignOrphan(cmd),
  listOrphans: () => app().listOrphans(),
  enqueueCaptures: (input: Parameters<ReturnType<typeof wire>["enqueueCaptures"]>[0]) => app().enqueueCaptures(input),
  processReceivingQueue: (opts?: { limit?: number }) => app().processReceivingQueue(opts),
};

// ── superficie pura (para tests y para la vista previa del escáner) ──
export { normalizeCarrierTracking, canonicalTracking } from "@/contexts/receiving/domain/tracking-normalization";
export { parseLabelRecipient, rankCandidates, foldName } from "@/contexts/receiving/domain/label-parse";
export { decideMatch } from "@/contexts/receiving/domain/match-decision";
export type { MatchDecision, OpenPreAlert, MatchMode } from "@/contexts/receiving/domain/match-decision";

export {
  DuplicateTrackingError,
  AmbiguousMatchError,
  ModeMismatchError,
} from "@/contexts/receiving/application/receive-package";

export {
  receivePackageSchema,
  scanPreviewSchema,
  assignOrphanSchema,
  measureSchema,
  measureCorrectionSchema,
  enqueueSchema,
} from "@/contexts/receiving/interfaces/dto";

/** Vista previa del escáner: normaliza + parsea etiqueta SIN tocar la base. */
export function scanPreview(input: { rawBarcode: string; labelRecipientRaw?: string | null }) {
  const t = normalizeCarrierTracking(input.rawBarcode);
  const label = parseLabelRecipient(input.labelRecipientRaw);
  return {
    raw: t.raw,
    normalized: t.normalized,
    carrier: t.carrier,
    suggestedMode: label.suggestedMode,
    recipientName: label.recipientName,
  };
}
