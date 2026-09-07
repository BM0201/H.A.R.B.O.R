/**
 * HARBOR PASO S.2 — Bandeja de huérfanos: asignación manual auditada.
 *
 * Un humano confirma el dueño. El OCR del nombre sólo produjo la lista ordenada
 * de candidatos (pura, `rankCandidates`) — nunca eligió. La confirmación queda
 * auditada con quién y cuándo (en `assignOrphan` de infraestructura).
 */
import { parseLabelRecipient, rankCandidates, type RankedCandidate } from "@/contexts/receiving/domain/label-parse";
import type { MatchMode } from "@/contexts/receiving/domain/match-decision";
import type { ReceivingRepository, PersistedPackage } from "@/contexts/receiving/application/ports";

export type OrphanCandidatesResult = {
  packageId: string;
  labelRecipientRaw: string | null;
  suggestedMode: MatchMode | null;
  candidates: RankedCandidate[];
};

export function createGetOrphanCandidates(deps: { repo: ReceivingRepository }) {
  return async function getOrphanCandidates(packageId: string): Promise<OrphanCandidatesResult> {
    const pkg = await deps.repo.getPackageForAssignment(packageId);
    if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
    if (pkg.status !== "ORPHAN") throw new Error("PACKAGE_NOT_ORPHAN: el paquete ya tiene dueño");

    const parsed = parseLabelRecipient(pkg.labelRecipientRaw);
    const customers = await deps.repo.activeCustomersForRanking();
    return {
      packageId,
      labelRecipientRaw: pkg.labelRecipientRaw,
      suggestedMode: parsed.suggestedMode,
      candidates: rankCandidates(parsed, customers).slice(0, 20),
    };
  };
}

export type AssignOrphanCommand = {
  packageId: string;
  customerId: string;
  mode: MatchMode;
  actorUserId: string;
  note?: string | null;
};

export function createAssignOrphan(deps: { repo: ReceivingRepository }) {
  return async function assignOrphan(cmd: AssignOrphanCommand): Promise<PersistedPackage> {
    const pkg = await deps.repo.getPackageForAssignment(cmd.packageId);
    if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
    if (pkg.status !== "ORPHAN") throw new Error("PACKAGE_NOT_ORPHAN: el paquete ya tiene dueño");

    return deps.repo.assignOrphan({
      packageId: cmd.packageId,
      customerId: cmd.customerId,
      mode: cmd.mode,
      actorUserId: cmd.actorUserId,
      note: cmd.note ?? null,
    });
  };
}
