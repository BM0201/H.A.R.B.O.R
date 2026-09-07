/**
 * HARBOR PASO S.2 + S.3 — Caso de uso: recibir un paquete en la bodega de origen.
 *
 *   escanear → normalizar tracking → match contra pre-alerta → (pesar) → cotizar
 *
 * La llave del match es el TRACKING normalizado, nunca el nombre. El nombre de
 * la etiqueta sólo pre-llena la bandeja de huérfanos.
 */
import { normalizeCarrierTracking } from "@/contexts/receiving/domain/tracking-normalization";
import { parseLabelRecipient } from "@/contexts/receiving/domain/label-parse";
import { decideMatch, type MatchMode } from "@/contexts/receiving/domain/match-decision";
import { computeVolumetricLb, computeChargeableLb } from "@/contexts/cargo";
import { generateTrackingCode } from "@/contexts/cargo";
import type { ReceivingRepository, RateQuoter, PersistedPackage, MeasurementInput } from "@/contexts/receiving/application/ports";

export type ReceivePackageCommand = {
  rawBarcode: string;
  labelRecipientRaw?: string | null;
  /** modalidad forzada por el operador (si la etiqueta no se leyó) */
  declaredMode?: MatchMode | null;
  originBranchId?: string | null;
  declaredValue?: number | null;
  receivedByUserId: string;
  /** medición tomada en el mismo acto */
  weightOriginLb?: number | null;
  lengthIn?: number | null;
  widthIn?: number | null;
  heightIn?: number | null;
  weightSource?: "SCALE" | "MANUAL";
  /** el operador confirmó proceder pese a la discrepancia de modalidad */
  overrideModeMismatch?: boolean;
};

export type ReceivePackageResult = {
  outcome: "ASSIGNED" | "ORPHAN" | "MODE_REVIEW";
  package: PersistedPackage;
  carrierGuess: string;
  normalizedTracking: string;
};

export class DuplicateTrackingError extends Error {
  constructor(public readonly existingTrackingCode: string) {
    super("DUPLICATE_ORIGIN_TRACKING: ya existe un paquete con ese tracking de origen");
    this.name = "DuplicateTrackingError";
  }
}

export class AmbiguousMatchError extends Error {
  constructor(public readonly preAlertIds: string[]) {
    super("AMBIGUOUS_PREALERT_MATCH: mas de una pre-alerta reclama el mismo tracking");
    this.name = "AmbiguousMatchError";
  }
}

export class ModeMismatchError extends Error {
  constructor(
    public readonly detail: { preAlertMode: MatchMode; labelMode: MatchMode; customerId: string },
  ) {
    super("MODE_MISMATCH: la modalidad de la etiqueta no coincide con la pre-alerta");
    this.name = "ModeMismatchError";
  }
}

export function createReceivePackage(deps: { repo: ReceivingRepository; quoter: RateQuoter; now?: () => Date }) {
  const now = deps.now ?? (() => new Date());

  return async function receivePackage(cmd: ReceivePackageCommand): Promise<ReceivePackageResult> {
    const { raw, normalized, carrier } = normalizeCarrierTracking(cmd.rawBarcode);
    if (!normalized) throw new Error("EMPTY_BARCODE: el escaneo no produjo ningun codigo");

    const existing = await deps.repo.findExistingPackageByNormalizedTracking(normalized);
    if (existing) throw new DuplicateTrackingError(existing.trackingCode);

    const label = parseLabelRecipient(cmd.labelRecipientRaw);
    const labelMode: MatchMode | null = label.suggestedMode ?? cmd.declaredMode ?? null;

    const preAlerts = await deps.repo.findOpenPreAlertsByNormalizedTracking(normalized);
    const decision = decideMatch(normalized, preAlerts, labelMode);

    if (decision.kind === "AMBIGUOUS") throw new AmbiguousMatchError(decision.preAlertIds);

    // ── resolver modalidad, cliente y estado ──
    let status: "RECEIVED_ORIGIN" | "ORPHAN";
    let customerId: string | null;
    let preAlertId: string | null;
    let mode: MatchMode;
    let modeMismatch: { preAlertMode: MatchMode; labelMode: MatchMode } | null = null;
    let outcome: ReceivePackageResult["outcome"];

    if (decision.kind === "ASSIGN") {
      status = "RECEIVED_ORIGIN";
      customerId = decision.customerId;
      preAlertId = decision.preAlertId;
      mode = decision.mode;
      outcome = "ASSIGNED";
    } else if (decision.kind === "MODE_MISMATCH") {
      if (!cmd.overrideModeMismatch) {
        // NO auto-asignar. El route handler lo traduce a "a revisión humana".
        throw new ModeMismatchError({
          preAlertMode: decision.preAlertMode,
          labelMode: decision.labelMode,
          customerId: decision.customerId,
        });
      }
      // El operador confirmó: se recibe con la modalidad de la ETIQUETA (lo que
      // físicamente llegó) y se deja marca de la discrepancia en el timeline.
      status = "RECEIVED_ORIGIN";
      customerId = decision.customerId;
      preAlertId = decision.preAlertId;
      mode = decision.labelMode;
      modeMismatch = { preAlertMode: decision.preAlertMode, labelMode: decision.labelMode };
      outcome = "MODE_REVIEW";
    } else {
      // ORPHAN — sin pre-alerta. El OCR NO asigna: sólo se guarda la etiqueta
      // cruda para pre-llenar la bandeja.
      status = "ORPHAN";
      customerId = null;
      preAlertId = null;
      mode = labelMode ?? "AIR";
      outcome = "ORPHAN";
    }

    // ── medición + cotización (opcional en este acto) ──
    let measurement: MeasurementInput | null = null;
    let quote = null;
    if (cmd.weightOriginLb != null) {
      if (!(cmd.weightOriginLb > 0)) throw new Error("INVALID_WEIGHT: el peso debe ser mayor que 0");
      const dims = { lengthIn: cmd.lengthIn ?? undefined, widthIn: cmd.widthIn ?? undefined, heightIn: cmd.heightIn ?? undefined };
      const hasDims = dims.lengthIn != null && dims.widthIn != null && dims.heightIn != null;

      if (customerId) {
        quote = await deps.quoter.quote({
          mode,
          customerId,
          weightOriginLb: cmd.weightOriginLb,
          dimensions: hasDims ? dims : null,
          at: now(),
        });
      }
      const volumetricLb = quote
        ? quote.volumetricLb
        : computeVolumetricLb(hasDims ? dims : null, null);
      const chargeableLb = quote ? quote.chargeableLb : computeChargeableLb(cmd.weightOriginLb, volumetricLb);

      measurement = {
        weightOriginLb: cmd.weightOriginLb,
        lengthIn: cmd.lengthIn ?? null,
        widthIn: cmd.widthIn ?? null,
        heightIn: cmd.heightIn ?? null,
        volumetricLb,
        chargeableLb,
        weightSource: cmd.weightSource ?? "MANUAL",
      };
    }

    const trackingCode = await deps.repo.reserveTrackingCode(generateTrackingCode);

    const persisted = await deps.repo.persistReceived({
      trackingCode,
      status,
      mode,
      customerId,
      preAlertId,
      originBranchId: cmd.originBranchId ?? null,
      originCarrier: carrier === "UNKNOWN" ? null : carrier,
      originTrackingNumberRaw: raw,
      originTrackingNumberNormalized: normalized,
      labelRecipientRaw: cmd.labelRecipientRaw ?? null,
      declaredValue: cmd.declaredValue ?? null,
      receivedByUserId: cmd.receivedByUserId,
      measurement,
      quote,
      emitReceivedEvent: status === "RECEIVED_ORIGIN",
      modeMismatch,
    });

    return { outcome, package: persisted, carrierGuess: carrier, normalizedTracking: normalized };
  };
}
