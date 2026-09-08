/**
 * HARBOR PASO U.2 — Mostrador: encontrar a la persona, ver su casillero,
 * cobrar, entregar, facturar. La operación NO es vender.
 *
 * Buscar por nombre acá SÍ va (no contradice PASO S): en Doral una máquina
 * asigna sin testigos; en mostrador hay una persona con cédula y el cajero
 * confirma. El nombre BUSCA; la entrega la confirma un humano.
 */
import type { Prisma, PackageStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import { appendCargoTimeline } from "@/modules/cargo-timeline/append";
import { writeOutboxEvent } from "@/modules/outbox/writer";
import { normalizeCarrierTracking } from "@/contexts/receiving";
import { createMagicLinkToken } from "@/modules/portal/magic-link";
import { resolveOperationalDayForOperationTx } from "@/modules/operations/day-resolver";

const ON_THE_WAY_STATUSES: PackageStatus[] = [
  "PRE_ALERTED",
  "RECEIVED_ORIGIN",
  "ORPHAN",
  "CONSOLIDATED",
  "IN_TRANSIT",
  "IN_CUSTOMS",
];

const num = (d: Prisma.Decimal | null) => (d == null ? null : Number(d));
const money = (d: Prisma.Decimal | null, c: string | null) =>
  d == null ? null : `${c === "NIO" ? "C$" : "$"}${Number(d).toFixed(2)}`;

const CASILLERO_RE = /^[A-Z]{2,4}-?\d{3,6}$/i;

export type CounterSearchResult =
  | { kind: "casillero"; customerId: string }
  | { kind: "package"; customerId: string | null; trackingCode: string; packageTrackingCode: string }
  | { kind: "customers"; matches: { id: string; code: string; displayName: string; phone: string | null }[] }
  | { kind: "empty" };

export async function counterSearch(q: string): Promise<CounterSearchResult> {
  const query = q.trim();
  if (query.length < 2) return { kind: "empty" };

  // 1. ¿Parece un número de casillero?
  if (CASILLERO_RE.test(query)) {
    const c = await prisma.customer.findFirst({
      where: { code: { equals: query.toUpperCase(), mode: "insensitive" }, isActive: true },
      select: { id: true },
    });
    if (c) return { kind: "casillero", customerId: c.id };
  }

  // 2. ¿Parece un tracking de carrier? (tiene dígitos y largo)
  if (/\d/.test(query) && query.replace(/\s/g, "").length >= 8) {
    const normalized = normalizeCarrierTracking(query).normalized;
    const pkg = await prisma.package.findFirst({
      where: { OR: [{ originTrackingNumber: normalized }, { trackingCode: query.toUpperCase() }] },
      select: { trackingCode: true, customerId: true },
    });
    if (pkg) {
      return { kind: "package", customerId: pkg.customerId, trackingCode: pkg.trackingCode, packageTrackingCode: pkg.trackingCode };
    }
  }

  // 3. Nombre.
  const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
  const matches = await prisma.customer.findMany({
    where: {
      isActive: true,
      AND: tokens.map((t) => ({
        OR: [{ displayName: { contains: t, mode: "insensitive" } }, { legalName: { contains: t, mode: "insensitive" } }],
      })),
    },
    select: { id: true, code: true, displayName: true, phone: true },
    take: 15,
    orderBy: { displayName: "asc" },
  });
  if (matches.length > 0) return { kind: "customers", matches };
  return { kind: "empty" };
}

export async function counterCasilleroView(customerId: string, branchId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: {
      code: true,
      displayName: true,
      legalName: true,
      phone: true,
      creditProfiles: { where: { isActive: true }, select: { creditLimit: true, creditUsed: true } },
    },
  });

  const [ready, onTheWay, deliveredCount] = await Promise.all([
    prisma.package.findMany({
      where: { customerId, status: "AVAILABLE", currentBranchId: branchId },
      select: {
        id: true,
        trackingCode: true,
        mode: true,
        weightOriginLb: true,
        chargeableLb: true,
        quoteSubtotal: true,
        quoteCurrency: true,
        availableAt: true,
        saleOrderLines: { where: { saleOrder: { status: { in: ["PENDING_PAYMENT", "PAID"] } } }, select: { saleOrder: { select: { id: true, status: true } } } },
      },
      orderBy: { availableAt: "asc" },
    }),
    prisma.package.findMany({
      where: { customerId, status: { in: ON_THE_WAY_STATUSES } },
      select: { id: true, trackingCode: true, mode: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.package.count({ where: { customerId, status: { in: ["DELIVERED", "RETURNED"] } } }),
  ]);

  const credit = customer.creditProfiles[0];
  return {
    customerId,
    casillero: customer.code,
    name: customer.displayName,
    phone: customer.phone,
    hasCredit: Boolean(credit),
    creditAvailable: credit ? Number(credit.creditLimit) - Number(credit.creditUsed) : 0,
    available: ready.map((p) => ({
      id: p.id,
      trackingCode: p.trackingCode,
      mode: p.mode,
      weightLb: num(p.weightOriginLb),
      chargeableLb: num(p.chargeableLb),
      amount: money(p.quoteSubtotal, p.quoteCurrency),
      amountValue: num(p.quoteSubtotal) ?? 0,
      currency: p.quoteCurrency ?? "USD",
      billedOrder: p.saleOrderLines[0]?.saleOrder ?? null,
    })),
    onTheWay: onTheWay.map((p) => ({ id: p.id, trackingCode: p.trackingCode, mode: p.mode, status: p.status })),
    deliveredCount,
  };
}

export async function recordCounterVisit(branchId: string, customerId: string, userId: string): Promise<void> {
  await prisma.counterVisit.create({ data: { branchId, customerId, userId } });
}

export async function recentCounterVisits(branchId: string, limit = 8) {
  const rows = await prisma.counterVisit.findMany({
    where: { branchId },
    orderBy: { at: "desc" },
    distinct: ["customerId"],
    take: limit,
    select: { at: true, customer: { select: { id: true, code: true, displayName: true } } },
  });
  return rows.map((r) => ({ ...r.customer, at: r.at.toISOString() }));
}

/**
 * Entrega en mostrador. Cobrar y entregar son hechos SEPARADOS: se puede
 * entregar sin cobro si el cliente tiene crédito. Registra quién retira.
 */
export async function counterHandover(input: {
  customerId: string;
  branchId: string;
  actorUserId: string;
  packageIds: string[];
  recipientName: string;
  recipientIdNumber: string;
  signatureKey?: string | null;
  allowUnpaid?: boolean;
  note?: string | null;
}): Promise<{ dispatchTicketId: string; delivered: number }> {
  if (input.packageIds.length === 0) throw new Error("NO_PACKAGES");
  if (!input.recipientName.trim() || !input.recipientIdNumber.trim()) {
    throw new Error("RECIPIENT_REQUIRED: registrá nombre y documento de quien retira");
  }

  const ticketId = await prisma.$transaction(async (tx) => {
    const packages = await tx.package.findMany({
      where: { id: { in: input.packageIds }, customerId: input.customerId },
      select: {
        id: true,
        trackingCode: true,
        status: true,
        currentBranchId: true,
        customerId: true,
        mode: true,
        saleOrderLines: {
          where: { saleOrder: { status: { in: ["PENDING_PAYMENT", "PAID"] } } },
          select: { saleOrder: { select: { status: true } } },
        },
      },
    });
    if (packages.length !== input.packageIds.length) throw new Error("PACKAGE_NOT_FOUND_OR_NOT_OWNED");

    for (const p of packages) {
      if (p.status !== "AVAILABLE") throw new Error(`PACKAGE_NOT_AVAILABLE: ${p.trackingCode}`);
      if (p.currentBranchId !== input.branchId) throw new Error(`PACKAGE_NOT_HERE: ${p.trackingCode}`);
      const paid = p.saleOrderLines.some((l) => l.saleOrder.status === "PAID");
      if (!paid && !input.allowUnpaid) throw new Error(`PACKAGE_UNPAID: ${p.trackingCode} — cobrá o marcá entrega a crédito`);
    }

    if (input.allowUnpaid) {
      const credit = await tx.customerCreditProfile.findFirst({
        where: { customerId: input.customerId, isActive: true },
        select: { creditLimit: true, creditUsed: true },
      });
      if (!credit) throw new Error("NO_CREDIT: el cliente no tiene crédito activo para entrega sin cobro");
    }

    const { dayId } = await resolveOperationalDayForOperationTx(tx, input.branchId, input.actorUserId);

    const ticket = await tx.dispatchTicket.create({
      data: {
        branchId: input.branchId,
        operationalDayId: dayId,
        status: "DISPATCHED",
        preparedByUserId: input.actorUserId,
        dispatchedByUserId: input.actorUserId,
        dispatchedAt: new Date(),
        recipientName: input.recipientName.trim(),
        recipientIdNumber: input.recipientIdNumber.trim(),
        signatureUrl: input.signatureKey ?? null,
        notes: input.note ?? null,
        packages: { create: packages.map((p) => ({ packageId: p.id })) },
      },
    });

    for (const p of packages) {
      await tx.package.update({ where: { id: p.id }, data: { status: "DELIVERED", deliveredAt: new Date() } });
      await appendCargoTimeline(tx, {
        packageId: p.id,
        eventType: "STATUS_CHANGED",
        payload: {
          from: "AVAILABLE",
          to: "DELIVERED",
          dispatchTicketId: ticket.id,
          recipientName: input.recipientName.trim(),
          recipientIdNumber: input.recipientIdNumber.trim(),
          unpaid: Boolean(input.allowUnpaid),
        },
        actorUserId: input.actorUserId,
      });
      await writeOutboxEvent(tx, {
        eventType: "cargo.package_status_changed.v1",
        aggregateType: "Package",
        aggregateId: p.id,
        payload: { packageId: p.id, trackingCode: p.trackingCode, customerId: p.customerId, mode: p.mode, from: "AVAILABLE", to: "DELIVERED" },
      });
    }

    return ticket.id;
  });

  await logAuditEvent({
    actorUserId: input.actorUserId,
    branchId: input.branchId,
    module: "counter",
    action: "COUNTER_HANDOVER",
    entityType: "DispatchTicket",
    entityId: ticketId,
    metadataJson: {
      customerId: input.customerId,
      packageIds: input.packageIds,
      recipientName: input.recipientName.trim(),
      unpaid: Boolean(input.allowUnpaid),
    },
  });

  return { dispatchTicketId: ticketId, delivered: input.packageIds.length };
}

/** Enlace directo firmado para mandarle al cliente por WhatsApp. */
export async function counterMagicLink(customerId: string, origin: string): Promise<{ url: string; casillero: string }> {
  const customer = await prisma.customer.findUniqueOrThrow({ where: { id: customerId }, select: { code: true } });
  const token = createMagicLinkToken(customerId);
  return {
    url: `${origin.replace(/\/$/, "")}/portal/entrar?t=${encodeURIComponent(token)}`,
    casillero: customer.code,
  };
}
