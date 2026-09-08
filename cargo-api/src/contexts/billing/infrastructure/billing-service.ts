/**
 * HARBOR PASO U.3 — Facturación de flete (Prisma + auditoría).
 *
 * - Al facturar: se congela un `PackageQuote` por paquete (snapshot inmutable) y
 *   la `SaleOrderLine` apunta a ese id. Reimprimir NO recalcula nada.
 * - Cobrar y entregar son hechos separados (PASO U.2): esto solo cobra.
 * - Se conserva íntegra la infra de facturación nicaragüense heredada
 *   (`documentMode`, factura manual, orden de entrega). Cambia QUÉ se factura.
 */
import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import { appendCargoTimeline } from "@/modules/cargo-timeline/append";
import { resolveOperationalDayForOperationTx } from "@/modules/operations/day-resolver";
import { buildFreightInvoice, type FreightQuoteSnapshot, type FreightInvoice } from "@/contexts/billing/domain/freight-invoice";

const num = (d: Prisma.Decimal | null | undefined) => (d == null ? 0 : Number(d));

function freightOrderNumber(): string {
  return `FLT-${randomBytes(5).toString("hex").toUpperCase()}`;
}

/**
 * Factura los paquetes indicados (deben ser del cliente, estar AVAILABLE en la
 * sucursal y sin una factura POSTED). Devuelve la orden y el desglose.
 */
export async function billFreightForPickup(input: {
  customerId: string;
  branchId: string;
  actorUserId: string;
  packageIds: string[];
}): Promise<{ saleOrderId: string; orderNumber: string; invoice: FreightInvoice }> {
  if (input.packageIds.length === 0) throw new Error("NO_PACKAGES");

  const result = await prisma.$transaction(async (tx) => {
    const packages = await tx.package.findMany({
      where: { id: { in: input.packageIds }, customerId: input.customerId },
      select: {
        id: true,
        trackingCode: true,
        mode: true,
        status: true,
        currentBranchId: true,
        chargeableLb: true,
        weightOriginLb: true,
        quotePricePerLb: true,
        quoteSubtotal: true,
        quoteCurrency: true,
        quoteRateCardId: true,
        volumetricLb: true,
        currentQuoteId: true,
        saleOrderLines: { where: { saleOrder: { status: { in: ["PENDING_PAYMENT", "PAID"] } } }, select: { id: true } },
      },
    });

    if (packages.length !== input.packageIds.length) throw new Error("PACKAGE_NOT_FOUND_OR_NOT_OWNED");
    for (const p of packages) {
      if (p.status !== "AVAILABLE") throw new Error(`PACKAGE_NOT_AVAILABLE: ${p.trackingCode} está en ${p.status}`);
      if (p.currentBranchId !== input.branchId) throw new Error(`PACKAGE_NOT_HERE: ${p.trackingCode} no está en esta sucursal`);
      if (p.saleOrderLines.length > 0) throw new Error(`PACKAGE_ALREADY_BILLED: ${p.trackingCode}`);
      if (p.quoteSubtotal == null || p.quotePricePerLb == null) throw new Error(`PACKAGE_NOT_QUOTED: ${p.trackingCode}`);
    }

    // Snapshot de cotización por paquete.
    const snapshots: FreightQuoteSnapshot[] = [];
    const quoteIdByPackage = new Map<string, string>();
    for (const p of packages) {
      const quote = await tx.packageQuote.create({
        data: {
          packageId: p.id,
          rateCardId: p.quoteRateCardId,
          mode: p.mode,
          pricePerLb: num(p.quotePricePerLb),
          chargeableLb: num(p.chargeableLb ?? p.weightOriginLb),
          volumetricLb: num(p.volumetricLb),
          freightSubtotal: num(p.quoteSubtotal),
          currency: p.quoteCurrency ?? "USD",
          computedByUserId: input.actorUserId,
        },
      });
      quoteIdByPackage.set(p.id, quote.id);
      await tx.package.update({ where: { id: p.id }, data: { currentQuoteId: quote.id } });
      snapshots.push({
        packageId: p.id,
        trackingCode: p.trackingCode,
        mode: p.mode as "AIR" | "SEA",
        pricePerLb: num(p.quotePricePerLb),
        chargeableLb: num(p.chargeableLb ?? p.weightOriginLb),
        freightSubtotal: num(p.quoteSubtotal),
        storageAmount: 0,
        categoryAmount: 0,
        currency: p.quoteCurrency ?? "USD",
      });
    }

    const invoice = buildFreightInvoice(snapshots);

    const order = await tx.saleOrder.create({
      data: {
        orderNumber: freightOrderNumber(),
        branchId: input.branchId,
        customerId: input.customerId,
        createdByUserId: input.actorUserId,
        status: "PENDING_PAYMENT",
        subtotal: invoice.grandTotal,
        grandTotal: invoice.grandTotal,
        requiresTransport: false,
        saleOccurredAt: new Date(),
        lines: {
          create: invoice.lines.map((line) => ({
            description: line.label,
            packageId: line.packageId,
            packageQuoteId: quoteIdByPackage.get(line.packageId),
            quantity: 1,
            unitPrice: line.lineTotal,
            lineSubtotal: line.lineTotal,
            chargeableLb: snapshots.find((s) => s.packageId === line.packageId)?.chargeableLb ?? 0,
            freightAmount: line.freightAmount,
            storageAmount: line.storageAmount,
          })),
        },
      },
    });

    for (const p of packages) {
      await appendCargoTimeline(tx, {
        packageId: p.id,
        eventType: "BILLED",
        payload: { saleOrderId: order.id, orderNumber: order.orderNumber, amount: num(p.quoteSubtotal) },
        actorUserId: input.actorUserId,
      });
    }

    return { saleOrderId: order.id, orderNumber: order.orderNumber, invoice };
  });

  await logAuditEvent({
    actorUserId: input.actorUserId,
    branchId: input.branchId,
    module: "billing",
    action: "FREIGHT_INVOICE_CREATED",
    entityType: "SaleOrder",
    entityId: result.saleOrderId,
    metadataJson: { customerId: input.customerId, packageIds: input.packageIds, total: result.invoice.grandTotal },
  });

  return result;
}

/** Cobra una factura de flete contra una sesión de caja abierta (ya validada por el route). */
export async function collectFreightPayment(input: {
  saleOrderId: string;
  cashSessionId: string;
  actorUserId: string;
  branchId: string;
  method: "CASH" | "CARD" | "TRANSFER";
}): Promise<{ paymentId: string; orderStatus: string }> {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.saleOrder.findUniqueOrThrow({
      where: { id: input.saleOrderId },
      select: { id: true, status: true, grandTotal: true, branchId: true, payments: { where: { status: "POSTED" }, select: { id: true } } },
    });
    if (order.branchId !== input.branchId) throw new Error("ORDER_WRONG_BRANCH");
    if (order.payments.length > 0) throw new Error("ALREADY_PAID");
    if (order.status === "CANCELLED") throw new Error("ORDER_CANCELLED");

    const { dayId } = await resolveOperationalDayForOperationTx(tx, input.branchId, input.actorUserId);

    const payment = await tx.payment.create({
      data: {
        saleOrderId: order.id,
        cashSessionId: input.cashSessionId,
        operationalDayId: dayId,
        receivedByUserId: input.actorUserId,
        method: input.method,
        amount: order.grandTotal,
        currencyCode: "USD",
        paidAt: new Date(),
        postedAt: new Date(),
      },
    });
    await tx.saleOrder.update({ where: { id: order.id }, data: { status: "PAID", operationalDayId: dayId } });
    return { paymentId: payment.id, orderStatus: "PAID" };
  });

  await logAuditEvent({
    actorUserId: input.actorUserId,
    branchId: input.branchId,
    module: "billing",
    action: "FREIGHT_PAYMENT_COLLECTED",
    entityType: "SaleOrder",
    entityId: input.saleOrderId,
    metadataJson: { paymentId: result.paymentId, method: input.method },
  });

  return result;
}

/** Reconstruye el desglose de una factura desde lo GUARDADO — no toca RateCard. */
export async function getFreightInvoice(saleOrderId: string): Promise<{
  orderNumber: string;
  status: string;
  customer: { code: string; displayName: string };
  invoice: FreightInvoice;
  paidAt: string | null;
}> {
  const order = await prisma.saleOrder.findUniqueOrThrow({
    where: { id: saleOrderId },
    select: {
      orderNumber: true,
      status: true,
      customer: { select: { code: true, displayName: true } },
      payments: { where: { status: "POSTED" }, select: { paidAt: true } },
      lines: {
        select: {
          packageId: true,
          freightAmount: true,
          storageAmount: true,
          chargeableLb: true,
          package: { select: { trackingCode: true, mode: true } },
          packageQuote: { select: { pricePerLb: true, freightSubtotal: true, currency: true } },
        },
      },
    },
  });

  const snapshots: FreightQuoteSnapshot[] = order.lines.map((l) => ({
    packageId: l.packageId ?? "",
    trackingCode: l.package?.trackingCode ?? "?",
    mode: (l.package?.mode as "AIR" | "SEA") ?? "AIR",
    pricePerLb: num(l.packageQuote?.pricePerLb),
    chargeableLb: num(l.chargeableLb),
    freightSubtotal: num(l.packageQuote?.freightSubtotal ?? l.freightAmount),
    storageAmount: num(l.storageAmount),
    categoryAmount: 0,
    currency: l.packageQuote?.currency ?? "USD",
  }));

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    customer: order.customer,
    invoice: buildFreightInvoice(snapshots),
    paidAt: order.payments[0]?.paidAt?.toISOString() ?? null,
  };
}
