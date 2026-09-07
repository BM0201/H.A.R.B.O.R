/**
 * HARBOR PASO S.3 — Caso de uso: cotizar un paquete. Orquesta el dominio
 * (`resolveRate` + `computeQuote`) a través del puerto `RateCardReader`.
 */
import { resolveRate, type MatchMode } from "@/contexts/rating/domain/rate-resolution";
import { computeQuote, type Quote } from "@/contexts/rating/domain/quote";
import type { Dimensions } from "@/contexts/cargo";
import type { RateCardReader } from "@/contexts/rating/application/ports";

export type QuoteRequest = {
  mode: MatchMode;
  customerId: string | null;
  weightOriginLb: number;
  dimensions: Partial<Dimensions> | null;
  at: Date;
};

export type Quoter = {
  quote(req: QuoteRequest): Promise<Quote>;
};

export function createQuoter(reader: RateCardReader): Quoter {
  return {
    async quote(req) {
      const cards = await reader.listForResolution({ mode: req.mode, customerId: req.customerId });
      const rate = resolveRate(cards, { mode: req.mode, customerId: req.customerId, at: req.at });
      return computeQuote({
        weightOriginLb: req.weightOriginLb,
        dimensions: req.dimensions,
        rate,
      });
    },
  };
}
