/**
 * HARBOR PASO S.3 — DTOs / validación de entrada del contexto `rating`.
 */
import { z } from "zod";

export const rateCardModeSchema = z.enum(["AIR", "SEA"]);

export const createRateCardSchema = z.object({
  name: z.string().min(2).max(120),
  mode: rateCardModeSchema,
  pricePerLb: z.number().positive().max(1000),
  minimumCharge: z.number().min(0).max(100000).default(0),
  volumetricDivisor: z.number().positive().max(100000).nullable().default(null),
  currency: z.enum(["USD", "NIO"]).default("USD"),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().nullable().default(null),
  customerId: z.string().cuid().nullable().default(null),
});

export const updateRateCardSchema = z
  .object({
    name: z.string().min(2).max(120),
    pricePerLb: z.number().positive().max(1000),
    minimumCharge: z.number().min(0).max(100000),
    volumetricDivisor: z.number().positive().max(100000).nullable(),
    isActive: z.boolean(),
    effectiveTo: z.coerce.date().nullable(),
  })
  .partial();

export const listRateCardsQuerySchema = z.object({
  mode: rateCardModeSchema.optional(),
  customerId: z.string().cuid().optional(),
  includeInactive: z.coerce.boolean().optional().default(false),
});

export type CreateRateCardDTO = z.infer<typeof createRateCardSchema>;
export type UpdateRateCardDTO = z.infer<typeof updateRateCardSchema>;
