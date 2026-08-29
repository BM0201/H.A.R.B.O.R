import { CashMovementType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import { getActiveCashSession, syncCashSessionSnapshotTx, userCanOperateCashSessionTx } from "@/modules/cash-session/service";
import type { CreateExpenseInput, UpdateExpenseInput } from "./validators";

/* ══════════════════════════════════════════════════════
 *  OPERATING EXPENSES
 * ══════════════════════════════════════════════════════ */

export type CreateOperatingExpenseOptions = {
  /**
   * Cuando es true, además de registrar el gasto se genera automáticamente un
   * CashMovement (EXPENSE_OUT) en la caja abierta de la sucursal y se enlaza al
   * gasto. Si no hay caja abierta, el gasto se crea igual pero sin egreso de
   * caja (cashApplied=false, reason=NO_OPEN_SESSION).
   */
  registerCashMovement?: boolean;
};

export type CreateOperatingExpenseResult = Prisma.OperatingExpenseGetPayload<Record<string, never>> & {
  cashApplied: boolean;
  cashReason?: string;
};

export async function createOperatingExpense(
  input: CreateExpenseInput,
  actorUserId: string,
  options: CreateOperatingExpenseOptions = {},
): Promise<CreateOperatingExpenseResult> {
  const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();
  const effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

  const baseData = {
    branchId: input.branchId,
    category: input.category as never,
    description: input.description,
    amount: new Prisma.Decimal(input.amount),
    effectiveFrom,
    effectiveTo,
    createdByUserId: actorUserId,
  };

  if (!options.registerCashMovement) {
    const expense = await prisma.operatingExpense.create({ data: baseData });
    await auditExpenseCreated(actorUserId, input, expense.id, false);
    return { ...expense, cashApplied: false };
  }

  const activeSession = await getActiveCashSession({ branchId: input.branchId });
  if (!activeSession) {
    const expense = await prisma.operatingExpense.create({ data: baseData });
    await auditExpenseCreated(actorUserId, input, expense.id, false);
    return { ...expense, cashApplied: false, cashReason: "NO_OPEN_SESSION" };
  }

  const result = await prisma.$transaction(async (tx) => {
    if (!(await userCanOperateCashSessionTx(tx, {
      cashSessionId: activeSession.id,
      userId: actorUserId,
      branchId: input.branchId,
    }))) {
      throw new Error("CASH_SESSION_OPERATOR_REQUIRED");
    }

    const movement = await tx.cashMovement.create({
      data: {
        cashSessionId: activeSession.id,
        type: CashMovementType.EXPENSE_OUT,
        amount: new Prisma.Decimal(input.amount),
        reason: input.description,
        createdByUserId: actorUserId,
      },
    });

    const expense = await tx.operatingExpense.create({
      data: { ...baseData, cashMovementId: movement.id },
    });

    await syncCashSessionSnapshotTx(tx, activeSession.id);

    return { expense, movementId: movement.id };
  });

  await auditExpenseCreated(actorUserId, input, result.expense.id, true, result.movementId);
  return { ...result.expense, cashApplied: true };
}

async function auditExpenseCreated(
  actorUserId: string,
  input: CreateExpenseInput,
  expenseId: string,
  cashApplied: boolean,
  cashMovementId?: string,
) {
  await logAuditEvent({
    actorUserId,
    branchId: input.branchId,
    module: "expenses",
    action: "EXPENSE_CREATED",
    entityType: "OperatingExpense",
    entityId: expenseId,
    metadataJson: {
      category: input.category,
      description: input.description,
      amount: input.amount,
      cashApplied,
      ...(cashMovementId ? { cashMovementId } : {}),
    },
  });
}

export async function updateOperatingExpense(
  id: string,
  input: UpdateExpenseInput,
  actorUserId: string,
) {
  const existing = await prisma.operatingExpense.findUniqueOrThrow({ where: { id } });

  const data: Prisma.OperatingExpenseUpdateInput = {};
  if (input.category !== undefined) data.category = input.category as never;
  if (input.description !== undefined) data.description = input.description;
  if (input.amount !== undefined) data.amount = new Prisma.Decimal(input.amount);
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.effectiveFrom !== undefined) data.effectiveFrom = new Date(input.effectiveFrom);
  if (input.effectiveTo !== undefined) data.effectiveTo = input.effectiveTo ? new Date(input.effectiveTo) : null;

  const updated = await prisma.operatingExpense.update({ where: { id }, data });

  await logAuditEvent({
    actorUserId,
    branchId: existing.branchId,
    module: "expenses",
    action: "EXPENSE_UPDATED",
    entityType: "OperatingExpense",
    entityId: id,
    metadataJson: { changes: input },
  });

  return updated;
}

export async function deleteOperatingExpense(id: string, actorUserId: string) {
  const existing = await prisma.operatingExpense.findUniqueOrThrow({ where: { id } });

  await prisma.operatingExpense.update({
    where: { id },
    data: { isActive: false },
  });

  await logAuditEvent({
    actorUserId,
    branchId: existing.branchId,
    module: "expenses",
    action: "EXPENSE_DELETED",
    entityType: "OperatingExpense",
    entityId: id,
    metadataJson: { category: existing.category, amount: existing.amount.toString() },
  });
}

export async function listExpensesByBranch(
  branchId: string,
  opts?: { effectiveFromGte?: Date; effectiveFromLt?: Date },
) {
  return prisma.operatingExpense.findMany({
    where: {
      branchId,
      isActive: true,
      ...(opts?.effectiveFromGte || opts?.effectiveFromLt
        ? {
            effectiveFrom: {
              ...(opts.effectiveFromGte ? { gte: opts.effectiveFromGte } : {}),
              ...(opts.effectiveFromLt ? { lt: opts.effectiveFromLt } : {}),
            },
          }
        : {}),
    },
    include: { branch: { select: { id: true, code: true, name: true } } },
    orderBy: [{ category: "asc" }, { description: "asc" }],
  });
}

export async function getMonthlyExpensesByBranch(branchId: string): Promise<Prisma.Decimal> {
  const now = new Date();
  const expenses = await prisma.operatingExpense.findMany({
    where: {
      branchId,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    select: { amount: true },
  });

  return expenses.reduce((sum, e) => sum.add(e.amount), new Prisma.Decimal(0));
}

export async function getExpenseSummaryByBranch(branchId: string, db: typeof prisma = prisma) {
  const now = new Date();
  const expenses = await db.operatingExpense.findMany({
    where: {
      branchId,
      isActive: true,
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    include: { branch: { select: { id: true, code: true, name: true } } },
    orderBy: [{ category: "asc" }, { description: "asc" }],
  });

  const byCategory: Record<string, { total: number; count: number; items: typeof expenses }> = {};
  let grandTotal = 0;

  for (const exp of expenses) {
    const cat = exp.category;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0, items: [] };
    const amount = Number(exp.amount);
    byCategory[cat].total += amount;
    byCategory[cat].count += 1;
    byCategory[cat].items.push(exp);
    grandTotal += amount;
  }

  return { byCategory, grandTotal, totalExpenses: expenses.length };
}

/**
 * Resumen consolidado de gastos operativos de TODAS las sucursales activas.
 * Un solo groupBy por sucursal+categoría, sin N+1.
 */
export async function getExpenseSummaryAllBranches(db: typeof prisma = prisma) {
  const now = new Date();
  const [grouped, branches] = await Promise.all([
    db.operatingExpense.groupBy({
      by: ["branchId", "category"],
      where: {
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      _sum: { amount: true },
    }),
    db.branch.findMany({
      where: { isActive: true },
      select: { id: true, code: true, name: true },
      orderBy: { code: "asc" },
    }),
  ]);

  const totalsByBranch = new Map<string, { byCategory: Record<string, number>; total: number }>();
  const totalsByCategory = new Map<string, number>();
  let grandTotal = 0;

  for (const row of grouped) {
    const amount = Number(row._sum.amount ?? 0);
    let entry = totalsByBranch.get(row.branchId);
    if (!entry) {
      entry = { byCategory: {}, total: 0 };
      totalsByBranch.set(row.branchId, entry);
    }
    entry.byCategory[row.category] = Math.round(((entry.byCategory[row.category] ?? 0) + amount) * 100) / 100;
    entry.total += amount;
    totalsByCategory.set(row.category, (totalsByCategory.get(row.category) ?? 0) + amount);
    grandTotal += amount;
  }

  const topCategory =
    [...totalsByCategory.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const byBranch = branches
    .map((b) => {
      const entry = totalsByBranch.get(b.id);
      return {
        branchId: b.id,
        branchCode: b.code,
        branchName: b.name,
        byCategory: entry?.byCategory ?? {},
        total: Math.round((entry?.total ?? 0) * 100) / 100,
      };
    })
    .sort((a, b) => b.total - a.total);

  return {
    grandTotal: Math.round(grandTotal * 100) / 100,
    branchesWithExpenses: byBranch.filter((b) => b.total > 0).length,
    totalBranches: branches.length,
    topCategory,
    byBranch,
  };
}
