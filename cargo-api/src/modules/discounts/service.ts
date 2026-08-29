import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";

type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function discountModel() { return (prisma as any).discount; }

export type CreateDiscountInput = {
  name: string;
  description?: string;
  type: DiscountType;
  value: number;
  productIds?: string[];
  abcCategories?: string[];
  xyzCategories?: string[];
  startDate?: string | null;
  endDate?: string | null;
  active?: boolean;
  branchId?: string | null;
  createdByUserId: string;
};

export type UpdateDiscountInput = Partial<Omit<CreateDiscountInput, "createdByUserId">>;

export async function listDiscounts(params?: { active?: boolean }) {
  const where: Record<string, unknown> = {};
  if (params?.active !== undefined) where.active = params.active;
  return discountModel().findMany({
    where,
    include: { createdBy: { select: { id: true, username: true, fullName: true } }, branch: { select: { id: true, code: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDiscount(id: string) {
  const d = await discountModel().findUnique({
    where: { id },
    include: { createdBy: { select: { id: true, username: true, fullName: true } }, branch: { select: { id: true, code: true, name: true } } },
  });
  if (!d) throw new Error("NOT_FOUND");
  return d;
}

export async function createDiscount(input: CreateDiscountInput) {
  // Input validation
  if (!input.name?.trim()) throw new Error("INVALID_INPUT: El nombre del descuento es requerido");
  if (!input.type) throw new Error("INVALID_INPUT: El tipo de descuento es requerido");
  if (input.type !== "PERCENTAGE" && input.type !== "FIXED_AMOUNT") {
    throw new Error("INVALID_INPUT: Tipo de descuento inválido. Debe ser PERCENTAGE o FIXED_AMOUNT");
  }
  if (typeof input.value !== "number" || input.value <= 0) {
    throw new Error("INVALID_INPUT: El valor del descuento debe ser un número positivo");
  }
  if (input.type === "PERCENTAGE" && input.value > 100) {
    throw new Error("INVALID_INPUT: El porcentaje de descuento no puede ser mayor a 100%");
  }
  if (!input.createdByUserId) throw new Error("INVALID_INPUT: createdByUserId es requerido");
  // Validate date range
  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (end < start) throw new Error("INVALID_INPUT: La fecha de fin no puede ser anterior a la fecha de inicio");
  }

  const d = await discountModel().create({
    data: {
      name: input.name,
      description: input.description ?? null,
      type: input.type,
      value: input.value,
      productIds: input.productIds?.join(",") ?? null,
      abcCategories: input.abcCategories?.join(",") ?? null,
      xyzCategories: input.xyzCategories?.join(",") ?? null,
      startDate: input.startDate ? new Date(input.startDate) : null,
      endDate: input.endDate ? new Date(input.endDate) : null,
      active: input.active ?? true,
      branchId: input.branchId ?? null,
      createdByUserId: input.createdByUserId,
    },
  });
  await logAuditEvent({
    actorUserId: input.createdByUserId,
    module: "discounts",
    action: "DISCOUNT_CREATED",
    entityType: "Discount",
    entityId: d.id,
    metadataJson: { name: d.name, type: d.type, value: Number(d.value) },
  });
  return d;
}

export async function updateDiscount(id: string, input: UpdateDiscountInput, actorUserId: string) {
  const existing = await discountModel().findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");

  // Validate updated fields
  if (input.name !== undefined && !input.name?.trim()) {
    throw new Error("INVALID_INPUT: El nombre del descuento no puede estar vacío");
  }
  if (input.type !== undefined && input.type !== "PERCENTAGE" && input.type !== "FIXED_AMOUNT") {
    throw new Error("INVALID_INPUT: Tipo de descuento inválido");
  }
  if (input.value !== undefined) {
    if (typeof input.value !== "number" || input.value <= 0) {
      throw new Error("INVALID_INPUT: El valor del descuento debe ser un número positivo");
    }
    const effectiveType = input.type ?? existing.type;
    if (effectiveType === "PERCENTAGE" && input.value > 100) {
      throw new Error("INVALID_INPUT: El porcentaje de descuento no puede ser mayor a 100%");
    }
  }
  // Validate date range
  const effectiveStart = input.startDate !== undefined ? input.startDate : existing.startDate?.toISOString() ?? null;
  const effectiveEnd = input.endDate !== undefined ? input.endDate : existing.endDate?.toISOString() ?? null;
  if (effectiveStart && effectiveEnd) {
    if (new Date(effectiveEnd) < new Date(effectiveStart)) {
      throw new Error("INVALID_INPUT: La fecha de fin no puede ser anterior a la fecha de inicio");
    }
  }

  const d = await discountModel().update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description ?? null }),
      ...(input.type !== undefined && { type: input.type }),
      ...(input.value !== undefined && { value: input.value }),
      ...(input.productIds !== undefined && { productIds: input.productIds?.join(",") ?? null }),
      ...(input.abcCategories !== undefined && { abcCategories: input.abcCategories?.join(",") ?? null }),
      ...(input.xyzCategories !== undefined && { xyzCategories: input.xyzCategories?.join(",") ?? null }),
      ...(input.startDate !== undefined && { startDate: input.startDate ? new Date(input.startDate) : null }),
      ...(input.endDate !== undefined && { endDate: input.endDate ? new Date(input.endDate) : null }),
      ...(input.active !== undefined && { active: input.active }),
      ...(input.branchId !== undefined && { branchId: input.branchId ?? null }),
    },
  });
  await logAuditEvent({
    actorUserId,
    module: "discounts",
    action: "DISCOUNT_UPDATED",
    entityType: "Discount",
    entityId: d.id,
    metadataJson: { changes: input },
  });
  return d;
}

export async function deleteDiscount(id: string, actorUserId: string) {
  const existing = await discountModel().findUnique({ where: { id } });
  if (!existing) throw new Error("NOT_FOUND");
  await discountModel().delete({ where: { id } });
  await logAuditEvent({
    actorUserId,
    module: "discounts",
    action: "DISCOUNT_DELETED",
    entityType: "Discount",
    entityId: id,
    metadataJson: { name: existing.name },
  });
}

/**
 * Get all currently active discounts applicable for a branch.
 * Used by POS to auto-apply discounts.
 */
export async function getActiveDiscountsForBranch(branchId: string) {
  const now = new Date();
  return discountModel().findMany({
    where: {
      active: true,
      OR: [
        { branchId: null },
        { branchId },
      ],
      AND: [
        { OR: [{ startDate: null }, { startDate: { lte: now } }] },
        { OR: [{ endDate: null }, { endDate: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
}
