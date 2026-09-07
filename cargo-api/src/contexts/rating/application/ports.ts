/**
 * HARBOR PASO S.3 — Puertos del contexto `rating`. La capa `application` sólo
 * conoce estas interfaces; las implementaciones Prisma viven en `infrastructure`.
 */
import type { RateCardInput, MatchMode } from "@/contexts/rating/domain/rate-resolution";

export type RateCardReader = {
  /** Tarjetas de la modalidad (activas o no) — la vigencia la decide el dominio. */
  listForResolution(input: { mode: MatchMode; customerId: string | null }): Promise<RateCardInput[]>;
};

export type { RateCardInput, MatchMode };
