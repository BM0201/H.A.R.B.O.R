/**
 * HARBOR PASO S — Adaptador Prisma del puerto `ReceivingRepository`.
 *
 * Aquí viven las TRANSACCIONES. Cada cambio de estado del paquete escribe, en
 * la MISMA `$transaction`:
 *   - la fila de `Package` (proyección de estado),
 *   - un `CargoTimelineEntry` inmutable con `seq` monótono (ADR-0005),
 *   - cuando aplica, un `OutboxEvent` (ADR-0006).
 * La auditoría se escribe después del commit (camino feliz).
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import { approvalService } from "@/modules/approvals/service";
import { APPROVAL_REQUEST_TYPES } from "@/modules/approvals/constants";
import { writeOutboxEvent } from "@/modules/outbox/writer";
import { computeWeightVariance, isWeightVarianceFlagged } from "@/contexts/cargo";
import type {
  ReceivingRepository,
  PersistReceivedInput,
  PersistedPackage,
  OpenPreAlert,
  MatchMode,
} from "@/contexts/receiving/application/ports";

const RECEIVED_EVENT = "receiving.package_received.v1";
const TRACKING_CODE_ATTEMPTS = 8;

function num(d: Prisma.Decimal | null): number | null {
  return d == null ? null : Number(d);
}

function toPersisted(p: {
  id: string;
  trackingCode: string;
  status: string;
  mode: string;
  customerId: string | null;
  weightOriginLb: Prisma.Decimal | null;
  chargeableLb: Prisma.Decimal | null;
  quoteSubtotal: Prisma.Decimal | null;
  quoteCurrency: string | null;
}): PersistedPackage {
  return {
    id: p.id,
    trackingCode: p.trackingCode,
    status: p.status,
    mode: p.mode,
    customerId: p.customerId,
    weightOriginLb: num(p.weightOriginLb),
    chargeableLb: num(p.chargeableLb),
    quoteSubtotal: num(p.quoteSubtotal),
    quoteCurrency: p.quoteCurrency,
  };
}

async function nextSeq(tx: Prisma.TransactionClient, packageId: string): Promise<number> {
  const last = await tx.cargoTimelineEntry.findFirst({
    where: { packageId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

async function appendTimeline(
  tx: Prisma.TransactionClient,
  packageId: string,
  eventType: string,
  payload: Record<string, unknown>,
  actorUserId: string | null,
): Promise<void> {
  await tx.cargoTimelineEntry.create({
    data: {
      packageId,
      seq: await nextSeq(tx, packageId),
      eventType,
      payloadJson: payload as Prisma.InputJsonValue,
      actorUserId,
    },
  });
}

function receivedEventPayload(pkg: {
  id: string;
  trackingCode: string;
  customerId: string | null;
  mode: string;
  weightOriginLb: Prisma.Decimal | null;
  quoteSubtotal: Prisma.Decimal | null;
  quoteCurrency: string | null;
}) {
  return {
    packageId: pkg.id,
    trackingCode: pkg.trackingCode,
    customerId: pkg.customerId,
    mode: pkg.mode,
    weightOriginLb: num(pkg.weightOriginLb),
    quoteSubtotal: num(pkg.quoteSubtotal),
    quoteCurrency: pkg.quoteCurrency,
  };
}

export function createPrismaReceivingRepository(): ReceivingRepository {
  return {
    async findExistingPackageByNormalizedTracking(normalized) {
      return prisma.package.findUnique({
        where: { originTrackingNumber: normalized },
        select: { id: true, trackingCode: true },
      });
    },

    async findOpenPreAlertsByNormalizedTracking(normalized) {
      const rows = await prisma.preAlert.findMany({
        where: { originTrackingNumber: normalized, matchedAt: null },
        select: { id: true, customerId: true, mode: true, originTrackingNumber: true },
      });
      return rows.map(
        (r): OpenPreAlert => ({
          id: r.id,
          customerId: r.customerId,
          mode: r.mode as MatchMode,
          originTrackingNumber: r.originTrackingNumber,
        }),
      );
    },

    async reserveTrackingCode(candidate) {
      for (let i = 0; i < TRACKING_CODE_ATTEMPTS; i++) {
        const code = candidate();
        const clash = await prisma.package.findUnique({ where: { trackingCode: code }, select: { id: true } });
        if (!clash) return code;
      }
      throw new Error("TRACKING_CODE_EXHAUSTED: no se pudo generar un codigo unico");
    },

    async persistReceived(input: PersistReceivedInput) {
      const m = input.measurement;
      const variance =
        m != null ? computeWeightVariance(m.weightOriginLb, null) : null; // aduana aún no pesó

      const created = await prisma.$transaction(async (tx) => {
        const pkg = await tx.package.create({
          data: {
            trackingCode: input.trackingCode,
            status: input.status,
            mode: input.mode,
            customerId: input.customerId,
            originBranchId: input.originBranchId,
            originCarrier: input.originCarrier,
            originTrackingNumber: input.originTrackingNumberNormalized,
            labelRecipientRaw: input.labelRecipientRaw,
            declaredValue: input.declaredValue,
            receivedByUserId: input.receivedByUserId,
            receivedAt: new Date(),
            weightOriginLb: m?.weightOriginLb ?? null,
            lengthIn: m?.lengthIn ?? null,
            widthIn: m?.widthIn ?? null,
            heightIn: m?.heightIn ?? null,
            volumetricLb: m?.volumetricLb ?? null,
            chargeableLb: m?.chargeableLb ?? null,
            weightSource: m?.weightSource ?? null,
            weightVariance: variance,
            weightVarianceFlagged: isWeightVarianceFlagged(variance),
            quoteRateCardId: input.quote?.rateCardId ?? null,
            quotePricePerLb: input.quote?.pricePerLb ?? null,
            quoteSubtotal: input.quote?.subtotal ?? null,
            quoteCurrency: (input.quote?.currency as "USD" | "NIO" | undefined) ?? null,
          },
        });

        await appendTimeline(
          tx,
          pkg.id,
          "PACKAGE_RECEIVED",
          {
            status: input.status,
            mode: input.mode,
            customerId: input.customerId,
            preAlertId: input.preAlertId,
            originCarrier: input.originCarrier,
            originTrackingNumber: input.originTrackingNumberNormalized,
            originTrackingNumberRaw: input.originTrackingNumberRaw,
          },
          input.receivedByUserId,
        );

        if (input.modeMismatch) {
          await appendTimeline(
            tx,
            pkg.id,
            "MODE_MISMATCH_FLAGGED",
            { preAlertMode: input.modeMismatch.preAlertMode, labelMode: input.modeMismatch.labelMode },
            input.receivedByUserId,
          );
        }

        if (m) {
          await appendTimeline(
            tx,
            pkg.id,
            "WEIGHED",
            {
              weightOriginLb: m.weightOriginLb,
              lengthIn: m.lengthIn,
              widthIn: m.widthIn,
              heightIn: m.heightIn,
              volumetricLb: m.volumetricLb,
              chargeableLb: m.chargeableLb,
              weightSource: m.weightSource,
            },
            input.receivedByUserId,
          );
        }
        if (input.quote) {
          await appendTimeline(
            tx,
            pkg.id,
            "QUOTED",
            {
              rateCardId: input.quote.rateCardId,
              pricePerLb: input.quote.pricePerLb,
              chargeableLb: input.quote.chargeableLb,
              subtotal: input.quote.subtotal,
              currency: input.quote.currency,
            },
            input.receivedByUserId,
          );
        }

        if (input.preAlertId) {
          await tx.preAlert.update({
            where: { id: input.preAlertId },
            data: { matchedAt: new Date(), packageId: pkg.id },
          });
        }

        if (input.emitReceivedEvent) {
          await writeOutboxEvent(tx, {
            eventType: RECEIVED_EVENT,
            aggregateType: "Package",
            aggregateId: pkg.id,
            payload: receivedEventPayload(pkg),
          });
        }

        return pkg;
      });

      await logAuditEvent({
        actorUserId: input.receivedByUserId,
        branchId: input.originBranchId ?? undefined,
        module: "receiving",
        action: input.status === "ORPHAN" ? "PACKAGE_RECEIVED_ORPHAN" : "PACKAGE_RECEIVED",
        entityType: "Package",
        entityId: created.id,
        metadataJson: {
          trackingCode: created.trackingCode,
          customerId: created.customerId,
          mode: created.mode,
          originTrackingNumber: input.originTrackingNumberNormalized,
          modeMismatch: input.modeMismatch ?? undefined,
        },
      });

      return toPersisted(created);
    },

    async listOrphans() {
      const rows = await prisma.package.findMany({
        where: { status: "ORPHAN" },
        orderBy: { receivedAt: "asc" },
        select: {
          id: true,
          trackingCode: true,
          originCarrier: true,
          originTrackingNumber: true,
          labelRecipientRaw: true,
          mode: true,
          receivedAt: true,
        },
      });
      const nowMs = Date.now();
      return rows.map((r) => ({
        ...r,
        ageDays: r.receivedAt ? Math.floor((nowMs - r.receivedAt.getTime()) / 86_400_000) : 0,
      }));
    },

    async activeCustomersForRanking() {
      return prisma.customer.findMany({
        where: { isActive: true },
        select: { id: true, code: true, displayName: true, legalName: true },
        take: 5000,
      });
    },

    async getPackageForAssignment(packageId) {
      return prisma.package.findUnique({
        where: { id: packageId },
        select: { id: true, status: true, originBranchId: true, labelRecipientRaw: true },
      });
    },

    async assignOrphan(input) {
      const updated = await prisma.$transaction(async (tx) => {
        const current = await tx.package.findUniqueOrThrow({
          where: { id: input.packageId },
          select: { status: true },
        });
        if (current.status !== "ORPHAN") throw new Error("PACKAGE_NOT_ORPHAN");

        const pkg = await tx.package.update({
          where: { id: input.packageId },
          data: { status: "RECEIVED_ORIGIN", customerId: input.customerId, mode: input.mode },
        });

        await appendTimeline(
          tx,
          pkg.id,
          "ORPHAN_ASSIGNED",
          { customerId: input.customerId, mode: input.mode, note: input.note },
          input.actorUserId,
        );

        await writeOutboxEvent(tx, {
          eventType: RECEIVED_EVENT,
          aggregateType: "Package",
          aggregateId: pkg.id,
          payload: receivedEventPayload(pkg),
        });

        return pkg;
      });

      await logAuditEvent({
        actorUserId: input.actorUserId,
        branchId: updated.originBranchId ?? undefined,
        module: "receiving",
        action: "ORPHAN_ASSIGNED",
        entityType: "Package",
        entityId: updated.id,
        metadataJson: { customerId: input.customerId, mode: input.mode, note: input.note ?? undefined },
      });

      return toPersisted(updated);
    },

    async getPackageForMeasure(packageId) {
      const p = await prisma.package.findUnique({
        where: { id: packageId },
        select: {
          id: true,
          status: true,
          mode: true,
          customerId: true,
          originBranchId: true,
          weightOriginLb: true,
          chargeableLb: true,
        },
      });
      if (!p) return null;
      return {
        id: p.id,
        status: p.status,
        mode: p.mode as MatchMode,
        customerId: p.customerId,
        originBranchId: p.originBranchId,
        weightOriginLb: num(p.weightOriginLb),
        chargeableLb: num(p.chargeableLb),
        hasMeasurement: p.weightOriginLb != null,
      };
    },

    async applyMeasurement(input) {
      const m = input.measurement;
      const updated = await prisma.$transaction(async (tx) => {
        const pkg = await tx.package.update({
          where: { id: input.packageId },
          data: {
            weightOriginLb: m.weightOriginLb,
            lengthIn: m.lengthIn,
            widthIn: m.widthIn,
            heightIn: m.heightIn,
            volumetricLb: m.volumetricLb,
            chargeableLb: m.chargeableLb,
            weightSource: m.weightSource,
            quoteRateCardId: input.quote?.rateCardId ?? null,
            quotePricePerLb: input.quote?.pricePerLb ?? null,
            quoteSubtotal: input.quote?.subtotal ?? null,
            quoteCurrency: (input.quote?.currency as "USD" | "NIO" | undefined) ?? null,
          },
        });

        await appendTimeline(
          tx,
          pkg.id,
          "WEIGHED",
          {
            weightOriginLb: m.weightOriginLb,
            lengthIn: m.lengthIn,
            widthIn: m.widthIn,
            heightIn: m.heightIn,
            volumetricLb: m.volumetricLb,
            chargeableLb: m.chargeableLb,
            weightSource: m.weightSource,
            correction: input.isCorrection,
          },
          input.actorUserId,
        );
        if (input.quote) {
          await appendTimeline(
            tx,
            pkg.id,
            "QUOTED",
            {
              rateCardId: input.quote.rateCardId,
              pricePerLb: input.quote.pricePerLb,
              chargeableLb: input.quote.chargeableLb,
              subtotal: input.quote.subtotal,
              currency: input.quote.currency,
            },
            input.actorUserId,
          );
        }
        return pkg;
      });

      await logAuditEvent({
        actorUserId: input.actorUserId,
        branchId: updated.originBranchId ?? undefined,
        module: "receiving",
        action: "PACKAGE_WEIGHED",
        entityType: "Package",
        entityId: updated.id,
        metadataJson: {
          weightOriginLb: m.weightOriginLb,
          chargeableLb: m.chargeableLb,
          weightSource: m.weightSource,
          subtotal: input.quote?.subtotal,
        },
      });

      return toPersisted(updated);
    },

    async openMeasureCorrectionApproval(input) {
      const res = await approvalService.createRequest({
        type: APPROVAL_REQUEST_TYPES.PACKAGE_MEASURE_CORRECTION,
        branchId: input.branchId,
        referenceType: "Package",
        referenceId: input.packageId,
        reason: input.reason,
        payloadJson: { requested: input.requested },
        requestedByUserId: input.actorUserId,
      });

      if (res.created) {
        await prisma.$transaction(async (tx) => {
          await appendTimeline(
            tx,
            input.packageId,
            "MEASURE_CORRECTION_REQUESTED",
            { approvalRequestId: res.requestId, requested: input.requested, reason: input.reason },
            input.actorUserId,
          );
        });
      }

      return { approvalRequestId: res.requestId, created: res.created };
    },
  };
}
