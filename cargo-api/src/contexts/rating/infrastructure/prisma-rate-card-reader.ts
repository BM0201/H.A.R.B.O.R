/**
 * HARBOR PASO S.3 — Adaptador Prisma del puerto `RateCardReader`.
 * Mapea `RateCard` (Prisma) → `RateCardInput` (dominio): Decimal → number.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import type { RateCardReader, RateCardInput, MatchMode } from "@/contexts/rating/application/ports";

type Db = PrismaClient | Prisma.TransactionClient;

const toNum = (d: Prisma.Decimal | null): number | null => (d == null ? null : Number(d));

export function createPrismaRateCardReader(db: Db = defaultPrisma): RateCardReader {
  return {
    async listForResolution({ mode, customerId }) {
      const rows = await db.rateCard.findMany({
        where: {
          mode: mode as MatchMode,
          OR: [{ customerId: null }, ...(customerId ? [{ customerId }] : [])],
        },
      });
      return rows.map(
        (r): RateCardInput => ({
          id: r.id,
          mode: r.mode as MatchMode,
          pricePerLb: Number(r.pricePerLb),
          minimumCharge: Number(r.minimumCharge),
          volumetricDivisor: toNum(r.volumetricDivisor),
          currency: r.currency,
          isActive: r.isActive,
          effectiveFrom: r.effectiveFrom,
          effectiveTo: r.effectiveTo,
          customerId: r.customerId,
        }),
      );
    },
  };
}
