/**
 * HARBOR PASO S.3 — Cálculo de la cotización. Función PURA, sin base de datos.
 *
 *   volumetricLb = divisor ? (L × W × H) / divisor : 0
 *   chargeableLb = max(weightOriginLb, volumetricLb)
 *   subtotal     = max(chargeableLb × pricePerLb, minimumCharge)
 *
 * D-1: hoy `volumetricDivisor` es null en todas las tarifas → volumetricLb = 0
 * → chargeableLb = weightOriginLb. El campo se captura igual.
 */
// `cargo` es el agregado raíz; `rating` construye sobre él. Import por el índice
// público (la regla arch prohíbe el import profundo, no este).
import { computeVolumetricLb, computeChargeableLb, type Dimensions } from "@/contexts/cargo";
import type { RateCardInput } from "@/contexts/rating/domain/rate-resolution";

export type QuoteInput = {
  weightOriginLb: number;
  dimensions: Partial<Dimensions> | null;
  rate: Pick<RateCardInput, "id" | "pricePerLb" | "minimumCharge" | "volumetricDivisor" | "currency">;
};

export type Quote = {
  rateCardId: string;
  pricePerLb: number;
  volumetricLb: number;
  chargeableLb: number;
  subtotal: number;
  currency: string;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function computeQuote(input: QuoteInput): Quote {
  if (!(input.weightOriginLb > 0)) {
    throw new Error("INVALID_WEIGHT: el peso de origen debe ser mayor que 0 para cotizar");
  }
  const volumetricLb = computeVolumetricLb(input.dimensions, input.rate.volumetricDivisor);
  const chargeableLb = computeChargeableLb(input.weightOriginLb, volumetricLb);
  const byWeight = chargeableLb * input.rate.pricePerLb;
  const subtotal = round2(Math.max(byWeight, input.rate.minimumCharge));
  return {
    rateCardId: input.rate.id,
    pricePerLb: input.rate.pricePerLb,
    volumetricLb,
    chargeableLb,
    subtotal,
    currency: input.rate.currency,
  };
}
