/**
 * HARBOR PASO U — Adaptador Prisma de `CargoRepository` (transición de estado).
 * `status`/`currentBranchId`/`availableAt`/`deliveredAt` en una `$tx` con el
 * `CargoTimelineEntry` y el `OutboxEvent`.
 */
import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import { appendCargoTimeline } from "@/modules/cargo-timeline/append";
import { writeOutboxEvent } from "@/modules/outbox/writer";
import type { CargoRepository } from "@/contexts/cargo/application/advance-package";
import type { PackageStatus } from "@/contexts/cargo/domain/package-status";

const STATUS_EVENT = "cargo.package_status_changed.v1";

export function createPrismaCargoRepository(): CargoRepository {
  return {
    async getForTransition(packageId) {
      const p = await prisma.package.findUnique({
        where: { id: packageId },
        select: { id: true, trackingCode: true, status: true, customerId: true, currentBranchId: true },
      });
      if (!p) return null;
      return { ...p, status: p.status as PackageStatus };
    },

    async applyTransition(input) {
      const now = new Date();
      const updated = await prisma.$transaction(async (tx) => {
        const before = await tx.package.findUniqueOrThrow({
          where: { id: input.packageId },
          select: { status: true, currentBranchId: true },
        });

        const pkg = await tx.package.update({
          where: { id: input.packageId },
          data: {
            status: input.to,
            ...(input.setCurrentBranchId !== undefined ? { currentBranchId: input.setCurrentBranchId } : {}),
            ...(input.markAvailableNow ? { availableAt: now } : {}),
            ...(input.markDeliveredNow ? { deliveredAt: now } : {}),
          },
          select: { id: true, trackingCode: true, status: true, currentBranchId: true, customerId: true, mode: true },
        });

        await appendCargoTimeline(tx, {
          packageId: pkg.id,
          eventType: "STATUS_CHANGED",
          payload: {
            from: before.status,
            to: input.to,
            currentBranchId: pkg.currentBranchId,
            note: input.note,
            manual: true,
          },
          actorUserId: input.actorUserId,
        });

        await writeOutboxEvent(tx, {
          eventType: STATUS_EVENT,
          aggregateType: "Package",
          aggregateId: pkg.id,
          payload: {
            packageId: pkg.id,
            trackingCode: pkg.trackingCode,
            customerId: pkg.customerId,
            mode: pkg.mode,
            from: before.status,
            to: input.to,
          },
        });

        return pkg;
      });

      await logAuditEvent({
        actorUserId: input.actorUserId,
        branchId: updated.currentBranchId ?? undefined,
        module: "cargo",
        action: "PACKAGE_STATUS_CHANGED",
        entityType: "Package",
        entityId: updated.id,
        metadataJson: { to: input.to, note: input.note ?? undefined },
      });

      return {
        id: updated.id,
        trackingCode: updated.trackingCode,
        status: updated.status,
        currentBranchId: updated.currentBranchId,
      };
    },
  };
}
