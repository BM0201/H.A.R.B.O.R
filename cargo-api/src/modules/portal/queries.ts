/**
 * HARBOR PASO U.1 — Lecturas del portal. SIEMPRE scoped por el `customerId` de
 * la SESIÓN — nunca por uno del request. El portal NUNCA expone: valor
 * declarado, dirección, teléfono, ni datos de otros paquetes del consolidado.
 */
import { prisma } from "@/lib/prisma";
import { HAPPY_PATH, type PackageStatus } from "@/contexts/cargo";

const READY_STATUSES: PackageStatus[] = ["AVAILABLE"];
const IN_TRANSIT_STATUSES: PackageStatus[] = [
  "PRE_ALERTED",
  "RECEIVED_ORIGIN",
  "ORPHAN",
  "CONSOLIDATED",
  "IN_TRANSIT",
  "IN_CUSTOMS",
];
const DONE_STATUSES: PackageStatus[] = ["DELIVERED", "RETURNED", "LOST", "DAMAGED"];

const STAGE_LABEL: Record<string, string> = {
  PRE_ALERTED: "Pre-alertado",
  RECEIVED_ORIGIN: "Recibido en Doral",
  ORPHAN: "En verificación",
  CONSOLIDATED: "Consolidado",
  IN_TRANSIT: "En tránsito",
  IN_CUSTOMS: "En aduana",
  AVAILABLE: "Disponible para retiro",
  DELIVERED: "Entregado",
  RETURNED: "Devuelto",
  LOST: "Extraviado",
  DAMAGED: "Con novedad",
};

function money(amount: unknown, currency: string | null): string | null {
  if (amount == null) return null;
  const n = Number(amount);
  return `${currency === "NIO" ? "C$" : "$"}${n.toFixed(2)}`;
}

type PublicPackageCard = {
  trackingCode: string;
  status: string;
  stageLabel: string;
  mode: string;
  weightLb: number | null;
  amount: string | null;
  branchName: string | null;
};

function toCard(p: {
  trackingCode: string;
  status: string;
  mode: string;
  weightOriginLb: unknown;
  quoteSubtotal: unknown;
  quoteCurrency: string | null;
  currentBranch: { name: string } | null;
}): PublicPackageCard {
  return {
    trackingCode: p.trackingCode,
    status: p.status,
    stageLabel: STAGE_LABEL[p.status] ?? p.status,
    mode: p.mode,
    weightLb: p.weightOriginLb == null ? null : Number(p.weightOriginLb),
    amount: money(p.quoteSubtotal, p.quoteCurrency),
    branchName: p.currentBranch?.name ?? null,
  };
}

export async function getCasilleroView(customerId: string) {
  const customer = await prisma.customer.findUniqueOrThrow({
    where: { id: customerId },
    select: { code: true, displayName: true },
  });

  const packages = await prisma.package.findMany({
    where: { customerId },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    select: {
      trackingCode: true,
      status: true,
      mode: true,
      weightOriginLb: true,
      quoteSubtotal: true,
      quoteCurrency: true,
      currentBranch: { select: { name: true } },
    },
  });

  const ready = packages.filter((p) => READY_STATUSES.includes(p.status as PackageStatus)).map(toCard);
  const inTransit = packages.filter((p) => IN_TRANSIT_STATUSES.includes(p.status as PackageStatus)).map(toCard);
  const delivered = packages.filter((p) => DONE_STATUSES.includes(p.status as PackageStatus)).map(toCard);

  return {
    casillero: customer.code,
    name: customer.displayName,
    ready,
    inTransit,
    delivered,
    readyTotal: money(
      ready.reduce((sum, p) => sum + (p.amount ? Number(p.amount.replace(/[^0-9.]/g, "")) : 0), 0),
      packages.find((p) => p.quoteCurrency)?.quoteCurrency ?? "USD",
    ),
  };
}

export async function getPackageRoute(customerId: string, trackingCode: string) {
  const pkg = await prisma.package.findFirst({
    // scoped: el paquete DEBE ser de este cliente. Un código ajeno → null.
    where: { trackingCode: trackingCode.trim().toUpperCase(), customerId },
    select: {
      trackingCode: true,
      status: true,
      mode: true,
      weightOriginLb: true,
      quoteSubtotal: true,
      quoteCurrency: true,
      availableAt: true,
      deliveredAt: true,
      currentBranch: { select: { name: true } },
      timeline: {
        orderBy: { seq: "asc" },
        select: { eventType: true, occurredAt: true, payloadJson: true },
      },
    },
  });
  if (!pkg) return null;

  const reachedAt = new Map<string, Date>();
  for (const e of pkg.timeline) {
    if (e.eventType === "PACKAGE_RECEIVED") reachedAt.set("RECEIVED_ORIGIN", e.occurredAt);
    if (e.eventType === "STATUS_CHANGED") {
      const to = (e.payloadJson as { to?: string } | null)?.to;
      if (to) reachedAt.set(to, e.occurredAt);
    }
  }
  reachedAt.set("PRE_ALERTED", pkg.timeline[0]?.occurredAt ?? new Date());

  const currentIdx = HAPPY_PATH.indexOf(pkg.status as PackageStatus);
  const steps = HAPPY_PATH.map((stage, i) => ({
    stage,
    label: STAGE_LABEL[stage],
    state: reachedAt.has(stage) || i < currentIdx ? "done" : i === currentIdx ? "current" : "future",
    at: reachedAt.get(stage)?.toISOString() ?? null,
  }));
  // el estado actual real (por si es una excepción fuera del happy path)
  if (currentIdx === -1) {
    steps.push({
      stage: pkg.status,
      label: STAGE_LABEL[pkg.status] ?? pkg.status,
      state: "current",
      at: reachedAt.get(pkg.status)?.toISOString() ?? null,
    });
  }

  return {
    trackingCode: pkg.trackingCode,
    status: pkg.status,
    stageLabel: STAGE_LABEL[pkg.status] ?? pkg.status,
    mode: pkg.mode,
    weightLb: pkg.weightOriginLb == null ? null : Number(pkg.weightOriginLb),
    amount: money(pkg.quoteSubtotal, pkg.quoteCurrency),
    branchName: pkg.currentBranch?.name ?? null,
    steps,
  };
}
