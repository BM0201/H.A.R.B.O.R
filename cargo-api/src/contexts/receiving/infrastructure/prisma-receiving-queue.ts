/**
 * HARBOR PASO S.5 — Adaptador Prisma del puerto `ReceivingQueuePort`.
 * `offlineClientId` `@unique` dedupe por device: reintentar la subida no
 * duplica la captura.
 */
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type {
  ReceivingQueuePort,
  PendingQueueItem,
  QueuedCapture,
} from "@/contexts/receiving/application/receiving-queue";
import type { MatchMode } from "@/contexts/receiving/domain/match-decision";

function num(d: Prisma.Decimal | null): number | null {
  return d == null ? null : Number(d);
}

export function createPrismaReceivingQueue(): ReceivingQueuePort {
  return {
    async enqueue({ captures, capturedByUserId, originBranchId }) {
      const ids = captures.map((c: QueuedCapture) => c.offlineClientId);
      const existing = new Set(
        (
          await prisma.receivingQueueItem.findMany({
            where: { offlineClientId: { in: ids } },
            select: { offlineClientId: true },
          })
        ).map((r) => r.offlineClientId),
      );

      const fresh = captures.filter((c) => !existing.has(c.offlineClientId));
      if (fresh.length > 0) {
        await prisma.receivingQueueItem.createMany({
          data: fresh.map((c) => ({
            offlineClientId: c.offlineClientId,
            capturedByUserId,
            originBranchId: originBranchId ?? null,
            rawBarcode: c.rawBarcode,
            weightOriginLb: c.weightOriginLb ?? null,
            lengthIn: c.lengthIn ?? null,
            widthIn: c.widthIn ?? null,
            heightIn: c.heightIn ?? null,
            photoKey: c.photoKey ?? null,
            labelRecipientRaw: c.labelRecipientRaw ?? null,
            weightSource: c.weightSource ?? null,
            capturedAt: new Date(c.capturedAt),
            status: "PENDING_MATCH",
          })),
          skipDuplicates: true,
        });
      }
      return { accepted: fresh.length, duplicates: captures.length - fresh.length };
    },

    async claimPending(limit) {
      const rows = await prisma.receivingQueueItem.findMany({
        where: { status: "PENDING_MATCH" },
        orderBy: { capturedAt: "asc" },
        take: limit,
        select: {
          id: true,
          offlineClientId: true,
          rawBarcode: true,
          labelRecipientRaw: true,
          weightOriginLb: true,
          lengthIn: true,
          widthIn: true,
          heightIn: true,
          weightSource: true,
          originBranchId: true,
          capturedByUserId: true,
        },
      });
      return rows.map(
        (r): PendingQueueItem => ({
          id: r.id,
          offlineClientId: r.offlineClientId,
          rawBarcode: r.rawBarcode,
          labelRecipientRaw: r.labelRecipientRaw,
          declaredMode: null,
          weightOriginLb: num(r.weightOriginLb),
          lengthIn: num(r.lengthIn),
          widthIn: num(r.widthIn),
          heightIn: num(r.heightIn),
          weightSource: (r.weightSource as "SCALE" | "MANUAL" | null) ?? null,
          originBranchId: r.originBranchId,
          capturedByUserId: r.capturedByUserId,
        }),
      );
    },

    async markResult(id, result) {
      await prisma.receivingQueueItem.update({
        where: { id },
        data: {
          status: result.status,
          packageId: result.packageId,
          lastError: result.error,
          processedAt: new Date(),
        },
      });
    },
  };
}

export type { MatchMode };
