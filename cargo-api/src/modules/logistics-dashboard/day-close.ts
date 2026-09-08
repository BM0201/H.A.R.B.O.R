/**
 * HARBOR PASO U.4 — Un día operativo de sucursal HARBOR no cierra LIMPIO si hay:
 *  - retiros registrados sin cobro ni crédito asignado
 *  - paquetes marcados como entregados sin evidencia de entrega
 *
 * (El saldo `CUSTODY` sin confirmar ya lo bloquea el cierre de la SESIÓN de
 * caja — PASO R.4 — así que no se duplica acá.)
 *
 * Estos son ítems de ATENCIÓN: no impiden confirmar, exigen una nota escrita —
 * mismo criterio que el resto del checklist del día.
 */
import type { Prisma } from "@prisma/client";

export type LogisticsCloseAttention = {
  unpaidHandovers: number;
  handoversWithoutEvidence: number;
};

export async function logisticsCloseAttention(
  tx: Prisma.TransactionClient,
  input: { branchId: string; start: Date; end: Date },
): Promise<LogisticsCloseAttention> {
  const [unpaidHandovers, handoversWithoutEvidence] = await Promise.all([
    // Paquetes entregados hoy en esta sucursal cuya factura NO está pagada y
    // el cliente NO tiene crédito activo.
    tx.package.count({
      where: {
        currentBranchId: input.branchId,
        status: "DELIVERED",
        deliveredAt: { gte: input.start, lt: input.end },
        NOT: { saleOrderLines: { some: { saleOrder: { status: "PAID" } } } },
        customer: { creditProfiles: { none: { isActive: true } } },
      },
    }),
    // Guías despachadas hoy sin firma / evidencia.
    tx.dispatchTicket.count({
      where: {
        branchId: input.branchId,
        status: "DISPATCHED",
        dispatchedAt: { gte: input.start, lt: input.end },
        signatureUrl: null,
      },
    }),
  ]);

  return { unpaidHandovers, handoversWithoutEvidence };
}
