/**
 * Contexto `rating` — API pública. Tarifario por modalidad + cotización pura.
 * HARBOR PASO S.3.
 */
import { createQuoter, type Quoter } from "@/contexts/rating/application/quoter";
import { createPrismaRateCardReader } from "@/contexts/rating/infrastructure/prisma-rate-card-reader";
import type { Prisma, PrismaClient } from "@prisma/client";

/** Cotizador con lectura Prisma (opcionalmente dentro de una tx). */
export function makeQuoter(db?: PrismaClient | Prisma.TransactionClient): Quoter {
  return createQuoter(createPrismaRateCardReader(db));
}

export { createQuoter } from "@/contexts/rating/application/quoter";
export { createPrismaRateCardReader } from "@/contexts/rating/infrastructure/prisma-rate-card-reader";
export type { Quoter, QuoteRequest } from "@/contexts/rating/application/quoter";
export type { Quote } from "@/contexts/rating/domain/quote";
export { computeQuote } from "@/contexts/rating/domain/quote";
export {
  resolveRate,
  NoApplicableRateError,
  type RateCardInput,
  type MatchMode,
} from "@/contexts/rating/domain/rate-resolution";

export { listRateCards, createRateCard, updateRateCard } from "@/contexts/rating/infrastructure/rate-card-service";
export {
  createRateCardSchema,
  updateRateCardSchema,
  listRateCardsQuerySchema,
  type CreateRateCardDTO,
  type UpdateRateCardDTO,
} from "@/contexts/rating/interfaces/dto";
