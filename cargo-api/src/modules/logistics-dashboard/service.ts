/**
 * HARBOR PASO U.4 — Métricas LOGÍSTICAS de los tableros. El dinero no
 * desaparece (movimiento del día se conserva) pero deja de ser la métrica
 * principal: lo primero es dónde están los paquetes.
 */
import { prisma } from "@/lib/prisma";
import { getOperationalWindowForNow } from "@/modules/operations/service";

const num = (d: unknown) => (d == null ? 0 : Number(d));
const daysSince = (d: Date | null) => (d ? Math.floor((Date.now() - d.getTime()) / 86_400_000) : 0);

/** Centro Master — panorama de toda la operación. */
export async function masterLogisticsOverview() {
  const [atOrigin, oldestOrigin, originWeight, inTransit, inCustoms, oldestCustoms, available, custodyAccounts] =
    await Promise.all([
      prisma.package.count({ where: { status: { in: ["RECEIVED_ORIGIN", "CONSOLIDATED"] } } }),
      prisma.package.findFirst({
        where: { status: { in: ["RECEIVED_ORIGIN", "CONSOLIDATED"] } },
        orderBy: { receivedAt: "asc" },
        select: { receivedAt: true },
      }),
      prisma.package.aggregate({
        where: { status: { in: ["RECEIVED_ORIGIN", "CONSOLIDATED"] } },
        _sum: { chargeableLb: true },
      }),
      prisma.package.groupBy({ by: ["mode"], where: { status: "IN_TRANSIT" }, _count: true }),
      prisma.package.count({ where: { status: "IN_CUSTOMS" } }),
      prisma.package.findFirst({ where: { status: "IN_CUSTOMS" }, orderBy: { updatedAt: "asc" }, select: { updatedAt: true } }),
      prisma.package.groupBy({ by: ["currentBranchId"], where: { status: "AVAILABLE" }, _count: true }),
      prisma.treasuryAccount.findMany({ where: { type: "CUSTODY", holderUserId: { not: null } }, select: { id: true } }),
    ]);

  // Cobrado hoy (flete) — se conserva, ya no es lo primero.
  const window = getOperationalWindowForNow();
  const paidToday = await prisma.payment.aggregate({
    where: { status: "POSTED", paidAt: { gte: window.start, lt: window.end } },
    _sum: { amount: true },
  });

  const branchIds = available.map((a) => a.currentBranchId).filter(Boolean) as string[];
  const branches = branchIds.length
    ? await prisma.branch.findMany({ where: { id: { in: branchIds } }, select: { id: true, name: true } })
    : [];
  const nameById = new Map(branches.map((b) => [b.id, b.name]));

  // Saldo de custodia sin confirmar — nº de cuentas con portador (aprox. barata).
  const custodyOpen = custodyAccounts.length;

  return {
    hubDoral: {
      packages: atOrigin,
      chargeableLb: num(originWeight._sum.chargeableLb),
      oldestDays: daysSince(oldestOrigin?.receivedAt ?? null),
    },
    inTransit: inTransit.map((r) => ({ mode: r.mode, count: r._count })),
    inCustoms: { packages: inCustoms, oldestDays: daysSince(oldestCustoms?.updatedAt ?? null) },
    readyForPickup: available.map((a) => ({
      branchId: a.currentBranchId,
      branchName: a.currentBranchId ? nameById.get(a.currentBranchId) ?? "—" : "sin sucursal",
      count: a._count,
    })),
    movementToday: num(paidToday._sum.amount),
    unconfirmedCustody: custodyOpen,
  };
}

/** Operación de sucursal — el día de esta sucursal. */
export async function branchLogisticsOverview(branchId: string) {
  const window = getOperationalWindowForNow();

  const [arrivalsToday, availableHere, deliveredToday, pendingApprovals, paidToday] = await Promise.all([
    prisma.package.count({ where: { currentBranchId: branchId, status: "AVAILABLE", availableAt: { gte: window.start, lt: window.end } } }),
    prisma.package.count({ where: { currentBranchId: branchId, status: "AVAILABLE" } }),
    prisma.package.count({ where: { currentBranchId: branchId, status: "DELIVERED", deliveredAt: { gte: window.start, lt: window.end } } }),
    prisma.approvalRequest.count({ where: { branchId, status: { in: ["REQUESTED", "UNDER_REVIEW"] } } }),
    prisma.payment.aggregate({
      where: { status: "POSTED", paidAt: { gte: window.start, lt: window.end }, saleOrder: { branchId } },
      _sum: { amount: true },
    }),
  ]);

  return {
    arrivalsToday,
    availableForPickup: availableHere,
    deliveredToday,
    pendingApprovals,
    collectedToday: num(paidToday._sum.amount),
  };
}
