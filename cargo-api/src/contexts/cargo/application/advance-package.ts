/**
 * HARBOR PASO U — Caso de uso: mover un paquete a la siguiente etapa (MANUAL).
 *
 * Sin la lógica real de consolidación/embarque/aduana — eso llega en sus pasos.
 * Esto valida la transición contra la máquina de estados, actualiza la
 * proyección (`status`, `currentBranchId`, `availableAt`, `deliveredAt`),
 * escribe el timeline (ADR-0005) y el OutboxEvent (ADR-0006).
 */
import {
  assertTransition,
  transitionEffects,
  isTerminal,
  type PackageStatus,
} from "@/contexts/cargo/domain/package-status";

export type AdvanceCommand = {
  packageId: string;
  to: PackageStatus;
  actorUserId: string;
  /** sucursal destino — obligatoria al pasar a AVAILABLE */
  destinationBranchId?: string | null;
  note?: string | null;
};

export type AdvancedPackage = {
  id: string;
  trackingCode: string;
  status: string;
  currentBranchId: string | null;
};

export type CargoRepository = {
  getForTransition(packageId: string): Promise<{
    id: string;
    trackingCode: string;
    status: PackageStatus;
    customerId: string | null;
    currentBranchId: string | null;
  } | null>;
  applyTransition(input: {
    packageId: string;
    to: PackageStatus;
    actorUserId: string;
    setCurrentBranchId: string | null | undefined;
    markAvailableNow: boolean;
    markDeliveredNow: boolean;
    note: string | null;
  }): Promise<AdvancedPackage>;
};

export function createAdvancePackage(deps: { repo: CargoRepository }) {
  return async function advancePackage(cmd: AdvanceCommand): Promise<AdvancedPackage> {
    const pkg = await deps.repo.getForTransition(cmd.packageId);
    if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
    if (isTerminal(pkg.status) && pkg.status !== "DELIVERED" && pkg.status !== "DAMAGED") {
      throw new Error(`PACKAGE_IN_TERMINAL_STATE: ${pkg.status}`);
    }

    assertTransition(pkg.status, cmd.to);

    const fx = transitionEffects(cmd.to);
    if (fx.requiresDestinationBranch && !cmd.destinationBranchId) {
      throw new Error("DESTINATION_BRANCH_REQUIRED: pasar a AVAILABLE exige la sucursal donde queda disponible");
    }
    if (pkg.status !== "ORPHAN" && cmd.to !== "ORPHAN" && !pkg.customerId && cmd.to !== "RECEIVED_ORIGIN") {
      throw new Error("PACKAGE_HAS_NO_OWNER: asigná el dueño antes de avanzar");
    }

    return deps.repo.applyTransition({
      packageId: cmd.packageId,
      to: cmd.to,
      actorUserId: cmd.actorUserId,
      setCurrentBranchId: cmd.destinationBranchId ?? undefined,
      markAvailableNow: fx.markAvailableNow,
      markDeliveredNow: fx.markDeliveredNow,
      note: cmd.note ?? null,
    });
  };
}
