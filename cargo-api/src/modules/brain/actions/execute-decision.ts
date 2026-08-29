import { prisma } from "@/lib/prisma";
import { syncCashSessionSnapshotTx } from "@/modules/cash-session/service";
import { refreshOperationalDaySummaryTx } from "@/modules/operations/service";

type ExecuteInput = {
  decisionId: string;
  idempotencyKey: string;
  proposedActionType: string | null;
  proposedActionJson: unknown;
  actorUserId: string;
};

type ExecuteResult = {
  executed: boolean;
  action: string;
  executedEntityType?: string;
  executedEntityId?: string;
  message?: string;
  [key: string]: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export async function executeDecisionAction(input: ExecuteInput): Promise<ExecuteResult> {
  const action = input.proposedActionType ?? "REVIEW_ONLY";
  const payload = asRecord(input.proposedActionJson);

  if (action === "RECALCULATE_CASH_SESSION") {
    const cashSessionId = stringValue(payload.cashSessionId ?? asRecord(payload.target).entityId);
    if (!cashSessionId) return { executed: false, action, message: "Falta cashSessionId para recalcular caja." };
    const before = await prisma.cashSession.findUnique({
      where: { id: cashSessionId },
      select: { expectedCashAmount: true, differenceAmount: true },
    });
    const snapshot = await prisma.$transaction((tx) => syncCashSessionSnapshotTx(tx, cashSessionId));
    const after = await prisma.cashSession.findUnique({
      where: { id: cashSessionId },
      select: { expectedCashAmount: true, differenceAmount: true },
    });
    return {
      executed: true,
      action,
      executedEntityType: "CashSession",
      executedEntityId: cashSessionId,
      before: {
        expectedCashAmount: before?.expectedCashAmount?.toString() ?? null,
        differenceAmount: before?.differenceAmount?.toString() ?? null,
      },
      after: {
        expectedCashAmount: after?.expectedCashAmount?.toString() ?? null,
        differenceAmount: after?.differenceAmount?.toString() ?? null,
      },
      snapshot,
    };
  }

  if (action === "REFRESH_OPERATIONAL_DAY") {
    const operationalDayId = stringValue(payload.operationalDayId ?? asRecord(payload.target).entityId);
    if (!operationalDayId) return { executed: false, action, message: "Falta operationalDayId para refrescar Dia Operativo." };
    const before = await prisma.operationalDay.findUnique({
      where: { id: operationalDayId },
      select: { salesTotal: true, pendingPaymentTotal: true, autoClosedPendingReviewCount: true, summaryJson: true },
    });
    const after = await prisma.$transaction((tx) => refreshOperationalDaySummaryTx(tx, operationalDayId));
    return {
      executed: true,
      action,
      executedEntityType: "OperationalDay",
      executedEntityId: operationalDayId,
      before: before ? {
        salesTotal: before.salesTotal.toString(),
        pendingPaymentTotal: before.pendingPaymentTotal.toString(),
        autoClosedPendingReviewCount: before.autoClosedPendingReviewCount,
      } : null,
      after: after ? {
        salesTotal: after.salesTotal.toString(),
        pendingPaymentTotal: after.pendingPaymentTotal.toString(),
        autoClosedPendingReviewCount: after.autoClosedPendingReviewCount,
      } : null,
    };
  }

  // Acciones de tipo "revisión": no hay nada que el motor pueda ejecutar
  // automáticamente — la acción ES que un humano revise. Si un usuario llegó
  // hasta aquí (aprobó y presionó Ejecutar), está confirmando que la atendió,
  // así que la decisión se cierra como EXECUTED. Si la condición persiste, el
  // dedup por fingerprint la reabre legítimamente pasados 14 días.
  if (
    action === "CREATE_DISCOUNT_PROPOSAL"
    || action === "CREATE_AUDIT_CASE"
    || action === "REVIEW_CASH_SESSION"
    || action === "REQUIRE_CASH_REVIEW"
    || action === "REVIEW_ONLY"
    || action === "REPAIR_DRAFT_ORDER_TOTALS"
    || action === "BLOCK_ORDER_FOR_REVIEW"
    || action === "INVALIDATE_MANUAL_INVOICE"
    || action.startsWith("REVIEW_")
  ) {
    return {
      executed: true,
      action,
      reviewConfirmed: true,
      message: "Revisión confirmada por el usuario — decisión cerrada. Si la condición persiste, volverá a detectarse en un próximo escaneo.",
      proposedActionJson: payload,
    };
  }

  return {
    executed: false,
    action,
    message: "Accion no ejecutable por el motor actual; requiere revision manual.",
  };
}
