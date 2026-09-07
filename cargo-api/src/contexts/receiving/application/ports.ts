/**
 * HARBOR PASO S — Puertos del contexto `receiving`. La capa `application` sólo
 * conoce estas interfaces; Prisma y las transacciones viven en `infrastructure`.
 */
import type { OpenPreAlert, MatchMode } from "@/contexts/receiving/domain/match-decision";
import type { CustomerCandidateInput } from "@/contexts/receiving/domain/label-parse";
import type { Quote } from "@/contexts/rating";

export type { OpenPreAlert, MatchMode, CustomerCandidateInput, Quote };

/** Datos para materializar un paquete recién recibido en UNA transacción. */
export type PersistReceivedInput = {
  trackingCode: string;
  status: "RECEIVED_ORIGIN" | "ORPHAN";
  mode: MatchMode;
  customerId: string | null;
  preAlertId: string | null;
  originBranchId: string | null;
  originCarrier: string | null;
  originTrackingNumberRaw: string;
  originTrackingNumberNormalized: string;
  labelRecipientRaw: string | null;
  declaredValue: number | null;
  receivedByUserId: string;
  /** medición tomada en el mismo acto (opcional — puede pesarse después) */
  measurement: MeasurementInput | null;
  quote: Quote | null;
  /** true → además del timeline, escribir el OutboxEvent de notificación */
  emitReceivedEvent: boolean;
  /** marca de discrepancia leída de la etiqueta vs la pre-alerta */
  modeMismatch: { preAlertMode: MatchMode; labelMode: MatchMode } | null;
};

export type MeasurementInput = {
  weightOriginLb: number;
  lengthIn: number | null;
  widthIn: number | null;
  heightIn: number | null;
  volumetricLb: number;
  chargeableLb: number;
  weightSource: "SCALE" | "MANUAL";
};

export type PersistedPackage = {
  id: string;
  trackingCode: string;
  status: string;
  mode: string;
  customerId: string | null;
  weightOriginLb: number | null;
  chargeableLb: number | null;
  quoteSubtotal: number | null;
  quoteCurrency: string | null;
};

export type OrphanListItem = {
  id: string;
  trackingCode: string;
  originCarrier: string | null;
  originTrackingNumber: string | null;
  labelRecipientRaw: string | null;
  mode: string;
  receivedAt: Date | null;
  ageDays: number;
};

export type PackageForAssignment = {
  id: string;
  status: string;
  originBranchId: string | null;
  labelRecipientRaw: string | null;
};

export type PackageForMeasure = {
  id: string;
  status: string;
  mode: MatchMode;
  customerId: string | null;
  originBranchId: string | null;
  weightOriginLb: number | null;
  chargeableLb: number | null;
  hasMeasurement: boolean;
};

export type ReceivingRepository = {
  findExistingPackageByNormalizedTracking(normalized: string): Promise<{ id: string; trackingCode: string } | null>;
  findOpenPreAlertsByNormalizedTracking(normalized: string): Promise<OpenPreAlert[]>;
  reserveTrackingCode(candidate: () => string): Promise<string>;
  persistReceived(input: PersistReceivedInput): Promise<PersistedPackage>;

  listOrphans(): Promise<OrphanListItem[]>;
  activeCustomersForRanking(): Promise<CustomerCandidateInput[]>;
  getPackageForAssignment(packageId: string): Promise<PackageForAssignment | null>;
  assignOrphan(input: {
    packageId: string;
    customerId: string;
    mode: MatchMode;
    actorUserId: string;
    note: string | null;
  }): Promise<PersistedPackage>;

  getPackageForMeasure(packageId: string): Promise<PackageForMeasure | null>;
  applyMeasurement(input: {
    packageId: string;
    actorUserId: string;
    measurement: MeasurementInput;
    quote: Quote | null;
    isCorrection: boolean;
  }): Promise<PersistedPackage>;
  openMeasureCorrectionApproval(input: {
    packageId: string;
    branchId: string;
    actorUserId: string;
    requested: { weightOriginLb: number; lengthIn: number | null; widthIn: number | null; heightIn: number | null };
    reason: string;
  }): Promise<{ approvalRequestId: string; created: boolean }>;
};

/** Cotizador — lo provee el contexto `rating`. */
export type RateQuoter = {
  quote(req: {
    mode: MatchMode;
    customerId: string | null;
    weightOriginLb: number;
    dimensions: { lengthIn?: number; widthIn?: number; heightIn?: number } | null;
    at: Date;
  }): Promise<Quote>;
};
