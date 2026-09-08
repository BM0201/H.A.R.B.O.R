/**
 * Contexto `cargo` — API pública. AGREGADO RAÍZ (Package).
 *
 * PASO S expuso el núcleo puro del tramo de recepción. PASO U agrega la máquina
 * de estados completa y el caso de uso de transición manual.
 */
import { createAdvancePackage } from "@/contexts/cargo/application/advance-package";
import { createPrismaCargoRepository } from "@/contexts/cargo/infrastructure/prisma-cargo-repository";

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
  nextStatuses,
  transitionEffects,
  isUnowned,
  isTerminal,
  HAPPY_PATH,
  TERMINAL,
  type PackageStatus,
} from "@/contexts/cargo/domain/package-status";

export type { AdvanceCommand, AdvancedPackage } from "@/contexts/cargo/application/advance-package";

let _advance: ReturnType<typeof createAdvancePackage> | null = null;

export function advancePackage(cmd: Parameters<ReturnType<typeof createAdvancePackage>>[0]) {
  if (!_advance) _advance = createAdvancePackage({ repo: createPrismaCargoRepository() });
  return _advance(cmd);
}
