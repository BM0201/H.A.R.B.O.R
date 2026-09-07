/**
 * Contexto `cargo` — API pública. AGREGADO RAÍZ (Package).
 *
 * HARBOR PASO S expone sólo el núcleo puro del tramo de recepción: generación
 * del `trackingCode` no enumerable, matemática de medición (D-1/D-2) y la
 * máquina de estados acotada. La orquestación (casos de uso, HTTP, Prisma) del
 * camino de recepción vive en el contexto `receiving`, que consume este índice.
 */

export {
  generateTrackingCode,
  isWellFormedTrackingCode,
  TRACKING_ALPHABET,
  TRACKING_CODE_LENGTH,
} from "@/contexts/cargo/domain/tracking-code";

export {
  computeVolumetricLb,
  computeChargeableLb,
  computeWeightVariance,
  isWeightVarianceFlagged,
  WEIGHT_VARIANCE_FLAG_THRESHOLD,
  type Dimensions,
} from "@/contexts/cargo/domain/measurement";

export {
  canTransition,
  assertTransition,
  isUnowned,
  type PackageStatus,
} from "@/contexts/cargo/domain/package-status";
