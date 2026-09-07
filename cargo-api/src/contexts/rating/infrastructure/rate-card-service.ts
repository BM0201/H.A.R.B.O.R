/**
 * HARBOR PASO S.3 — CRUD de tarifario (Prisma + auditoría).
 *
 * Todo cambio queda en `AuditLog` con el valor anterior: es el número que
 * multiplica cada factura (§S.3). El guard de capacidad (`rate.edit`) lo aplica
 * el route handler, no esta capa.
 */
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import type { CreateRateCardDTO, UpdateRateCardDTO } from "@/contexts/rating/interfaces/dto";

export async function listRateCards(filters: {
  mode?: "AIR" | "SEA";
  customerId?: string;
  includeInactive?: boolean;
}) {
  return prisma.rateCard.findMany({
    where: {
      ...(filters.mode ? { mode: filters.mode } : {}),
      ...(filters.customerId ? { customerId: filters.customerId } : {}),
      ...(filters.includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ mode: "asc" }, { customerId: "asc" }, { effectiveFrom: "desc" }],
    include: { customer: { select: { id: true, code: true, displayName: true } } },
  });
}

export async function createRateCard(input: CreateRateCardDTO, actorUserId: string) {
  const card = await prisma.rateCard.create({
    data: {
      name: input.name,
      mode: input.mode,
      pricePerLb: input.pricePerLb,
      minimumCharge: input.minimumCharge,
      volumetricDivisor: input.volumetricDivisor,
      currency: input.currency,
      effectiveFrom: input.effectiveFrom,
      effectiveTo: input.effectiveTo,
      customerId: input.customerId,
      createdByUserId: actorUserId,
    },
  });
  await logAuditEvent({
    actorUserId,
    module: "rating",
    action: "RATE_CARD_CREATED",
    entityType: "RateCard",
    entityId: card.id,
    metadataJson: {
      mode: card.mode,
      pricePerLb: Number(card.pricePerLb),
      minimumCharge: Number(card.minimumCharge),
      customerId: card.customerId,
      effectiveFrom: card.effectiveFrom.toISOString(),
    },
  });
  return card;
}

export async function updateRateCard(id: string, patch: UpdateRateCardDTO, actorUserId: string) {
  const before = await prisma.rateCard.findUniqueOrThrow({ where: { id } });
  const after = await prisma.rateCard.update({
    where: { id },
    data: {
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.pricePerLb !== undefined ? { pricePerLb: patch.pricePerLb } : {}),
      ...(patch.minimumCharge !== undefined ? { minimumCharge: patch.minimumCharge } : {}),
      ...(patch.volumetricDivisor !== undefined ? { volumetricDivisor: patch.volumetricDivisor } : {}),
      ...(patch.isActive !== undefined ? { isActive: patch.isActive } : {}),
      ...(patch.effectiveTo !== undefined ? { effectiveTo: patch.effectiveTo } : {}),
    },
  });
  await logAuditEvent({
    actorUserId,
    module: "rating",
    action: "RATE_CARD_UPDATED",
    entityType: "RateCard",
    entityId: id,
    metadataJson: {
      before: {
        pricePerLb: Number(before.pricePerLb),
        minimumCharge: Number(before.minimumCharge),
        volumetricDivisor: before.volumetricDivisor == null ? null : Number(before.volumetricDivisor),
        isActive: before.isActive,
        effectiveTo: before.effectiveTo?.toISOString() ?? null,
      },
      after: {
        pricePerLb: Number(after.pricePerLb),
        minimumCharge: Number(after.minimumCharge),
        volumetricDivisor: after.volumetricDivisor == null ? null : Number(after.volumetricDivisor),
        isActive: after.isActive,
        effectiveTo: after.effectiveTo?.toISOString() ?? null,
      },
    },
  });
  return after;
}
