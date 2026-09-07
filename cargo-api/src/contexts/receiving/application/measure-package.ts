/**
 * HARBOR PASO S.3 — Pesaje y cotización de un paquete ya recibido, y la
 * corrección posterior.
 *
 * El guard de capacidad (`package.measure` para pesar; `package.measure.correct`
 * para corregir) lo aplica el route handler. Este caso de uso asume que el
 * llamador YA está autorizado y se ocupa de la lógica:
 *
 *  - primer pesaje  → aplica medición + cotización + timeline WEIGHED/QUOTED.
 *  - corrección      → NO escribe el número; abre un `ApprovalRequest`
 *    (PACKAGE_MEASURE_CORRECTION) y el peso queda sin cambiar hasta que se
 *    resuelva (frontera antifraude — PASO R.6).
 */
import { computeVolumetricLb, computeChargeableLb } from "@/contexts/cargo";
import type { MatchMode } from "@/contexts/receiving/domain/match-decision";
import type { ReceivingRepository, RateQuoter, PersistedPackage } from "@/contexts/receiving/application/ports";

export type MeasureCommand = {
  packageId: string;
  actorUserId: string;
  weightOriginLb: number;
  lengthIn?: number | null;
  widthIn?: number | null;
  heightIn?: number | null;
  weightSource: "SCALE" | "MANUAL";
};

export function createMeasurePackage(deps: { repo: ReceivingRepository; quoter: RateQuoter; now?: () => Date }) {
  const now = deps.now ?? (() => new Date());

  return async function measurePackage(cmd: MeasureCommand): Promise<PersistedPackage> {
    if (!(cmd.weightOriginLb > 0)) throw new Error("INVALID_WEIGHT: el peso debe ser mayor que 0");

    const pkg = await deps.repo.getPackageForMeasure(cmd.packageId);
    if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
    if (pkg.status === "ORPHAN") {
      throw new Error("PACKAGE_IS_ORPHAN: asigna el dueño antes de cotizar");
    }

    const dims = {
      lengthIn: cmd.lengthIn ?? undefined,
      widthIn: cmd.widthIn ?? undefined,
      heightIn: cmd.heightIn ?? undefined,
    };
    const hasDims = dims.lengthIn != null && dims.widthIn != null && dims.heightIn != null;

    const quote = pkg.customerId
      ? await deps.quoter.quote({
          mode: pkg.mode as MatchMode,
          customerId: pkg.customerId,
          weightOriginLb: cmd.weightOriginLb,
          dimensions: hasDims ? dims : null,
          at: now(),
        })
      : null;

    const volumetricLb = quote ? quote.volumetricLb : computeVolumetricLb(hasDims ? dims : null, null);
    const chargeableLb = quote ? quote.chargeableLb : computeChargeableLb(cmd.weightOriginLb, volumetricLb);

    return deps.repo.applyMeasurement({
      packageId: cmd.packageId,
      actorUserId: cmd.actorUserId,
      isCorrection: false,
      measurement: {
        weightOriginLb: cmd.weightOriginLb,
        lengthIn: cmd.lengthIn ?? null,
        widthIn: cmd.widthIn ?? null,
        heightIn: cmd.heightIn ?? null,
        volumetricLb,
        chargeableLb,
        weightSource: cmd.weightSource,
      },
      quote,
    });
  };
}

export type MeasureCorrectionCommand = {
  packageId: string;
  actorUserId: string;
  branchId: string;
  weightOriginLb: number;
  lengthIn?: number | null;
  widthIn?: number | null;
  heightIn?: number | null;
  reason: string;
};

export function createRequestMeasureCorrection(deps: { repo: ReceivingRepository }) {
  return async function requestMeasureCorrection(
    cmd: MeasureCorrectionCommand,
  ): Promise<{ approvalRequestId: string; created: boolean }> {
    if (!(cmd.weightOriginLb > 0)) throw new Error("INVALID_WEIGHT: el peso debe ser mayor que 0");
    if (!cmd.reason || cmd.reason.trim().length < 8) {
      throw new Error("REASON_REQUIRED: una correccion de peso exige un motivo");
    }

    const pkg = await deps.repo.getPackageForMeasure(cmd.packageId);
    if (!pkg) throw new Error("PACKAGE_NOT_FOUND");
    if (!pkg.hasMeasurement) {
      throw new Error("NO_MEASUREMENT_YET: usa el pesaje normal, no la correccion");
    }

    return deps.repo.openMeasureCorrectionApproval({
      packageId: cmd.packageId,
      branchId: cmd.branchId,
      actorUserId: cmd.actorUserId,
      requested: {
        weightOriginLb: cmd.weightOriginLb,
        lengthIn: cmd.lengthIn ?? null,
        widthIn: cmd.widthIn ?? null,
        heightIn: cmd.heightIn ?? null,
      },
      reason: cmd.reason.trim(),
    });
  };
}
