/**
 * HARBOR PASO S.3 — Resolución de tarifa. Función PURA.
 *
 * Regla: tarifa ESPECIAL del cliente vigente → tarifa GENERAL vigente de la
 * modalidad → error explícito. Nunca cobrar 0 (§S.3).
 *
 * "Vigente" = `isActive` y `effectiveFrom <= at < effectiveTo` (o `effectiveTo`
 * nulo). Entre varias vigentes candidatas gana la de `effectiveFrom` más
 * reciente (la última que entró en vigor).
 */

export type MatchMode = "AIR" | "SEA";

export type RateCardInput = {
  id: string;
  mode: MatchMode;
  pricePerLb: number;
  minimumCharge: number;
  volumetricDivisor: number | null;
  currency: string;
  isActive: boolean;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  /** null = tarifa general; con valor = especial de ese cliente */
  customerId: string | null;
};

export class NoApplicableRateError extends Error {
  constructor(mode: MatchMode, customerId: string | null) {
    super(
      `NO_APPLICABLE_RATE: sin tarifa vigente para modalidad ${mode}` +
        (customerId ? ` (cliente ${customerId} ni general)` : ""),
    );
    this.name = "NoApplicableRateError";
  }
}

function isEffective(card: RateCardInput, at: Date): boolean {
  if (!card.isActive) return false;
  if (card.effectiveFrom.getTime() > at.getTime()) return false;
  if (card.effectiveTo && card.effectiveTo.getTime() <= at.getTime()) return false;
  return true;
}

function mostRecent(a: RateCardInput, b: RateCardInput): RateCardInput {
  return a.effectiveFrom.getTime() >= b.effectiveFrom.getTime() ? a : b;
}

export function resolveRate(
  cards: readonly RateCardInput[],
  opts: { mode: MatchMode; customerId: string | null; at: Date },
): RateCardInput {
  const eligible = cards.filter((c) => c.mode === opts.mode && isEffective(c, opts.at));

  if (opts.customerId) {
    const special = eligible.filter((c) => c.customerId === opts.customerId);
    if (special.length > 0) return special.reduce(mostRecent);
  }

  const general = eligible.filter((c) => c.customerId === null);
  if (general.length > 0) return general.reduce(mostRecent);

  throw new NoApplicableRateError(opts.mode, opts.customerId);
}
