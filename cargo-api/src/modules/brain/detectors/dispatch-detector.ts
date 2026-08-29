import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { riskScoreFor } from "@/modules/brain/scoring";
import type { BrainDecisionDraft, BrainDetectorContext } from "@/modules/brain/types";

function n(value: Prisma.Decimal | number | null | undefined) {
  return Number(value ?? 0);
}

export async function detectDispatchDecisions(ctx: BrainDetectorContext): Promise<BrainDecisionDraft[]> {
  const decisions: BrainDecisionDraft[] = [];
  const lateThreshold = new Date(ctx.now.getTime() - 24 * 60 * 60 * 1000);

  const [lateTickets, transportOrders] = await Promise.all([
    prisma.dispatchTicket.findMany({
      where: {
        status: { in: ["PENDING", "IN_PROGRESS"] },
        createdAt: { lt: lateThreshold },
        ...(ctx.branchId ? { branchId: ctx.branchId } : {}),
      },
      include: {
        branch: { select: { id: true, code: true, name: true } },
        saleOrder: { select: { orderNumber: true, grandTotal: true, requiresTransport: true, transportAmount: true } },
      },
      take: 100,
      orderBy: { createdAt: "asc" },
    }),
    prisma.saleOrder.findMany({
      where: {
        createdAt: { gte: ctx.since },
        requiresTransport: true,
        transportAmount: { lte: 0 },
        ...(ctx.branchId ? { branchId: ctx.branchId } : {}),
      },
      include: { branch: { select: { id: true, code: true, name: true } } },
      take: 100,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  for (const ticket of lateTickets) {
    const orderNumber = ticket.saleOrder?.orderNumber ?? ticket.id;
    decisions.push({
      category: "DISPATCH",
      severity: "HIGH",
      title: `Retiro atrasado: ${orderNumber}`,
      description: `${ticket.branch.code} tiene un retiro ${ticket.status} desde ${ticket.createdAt.toLocaleDateString("es-NI")}.`,
      recommendation: "Priorizar preparacion/entrega y revisar si caja o consolidado bloquearon el flujo.",
      branchId: ticket.branchId,
      confidenceScore: 0.86,
      impactAmount: n(ticket.saleOrder?.grandTotal),
      riskScore: riskScoreFor("HIGH", 0.86),
      proposedActionType: "REVIEW_DISPATCH_TICKET",
      proposedActionJson: { dispatchTicketId: ticket.id, saleOrderId: ticket.saleOrderId },
      evidenceJson: { status: ticket.status, orderNumber, createdAt: ticket.createdAt.toISOString() },
      sourceJson: { detector: "dispatch-detector", dispatchTicketId: ticket.id },
      fingerprintParts: ["dispatch", "late-ticket", ticket.id],
    });
  }

  for (const order of transportOrders) {
    decisions.push({
      category: "DISPATCH",
      severity: "MEDIUM",
      title: `Flete posiblemente insuficiente: ${order.orderNumber}`,
      description: `${order.branch.code} requiere transporte pero tiene flete C$${n(order.transportAmount).toFixed(2)}.`,
      recommendation: "Validar tarifa de transporte antes de despachar para proteger margen logistico.",
      branchId: order.branchId,
      confidenceScore: 0.82,
      impactAmount: n(order.grandTotal),
      riskScore: riskScoreFor("MEDIUM", 0.82),
      proposedActionType: "REVIEW_TRANSPORT_CHARGE",
      evidenceJson: { orderNumber: order.orderNumber, transportAmount: n(order.transportAmount), grandTotal: n(order.grandTotal) },
      sourceJson: { detector: "dispatch-detector", saleOrderId: order.id },
      fingerprintParts: ["dispatch", "transport-zero-amount", order.id],
    });
  }

  return decisions;
}
