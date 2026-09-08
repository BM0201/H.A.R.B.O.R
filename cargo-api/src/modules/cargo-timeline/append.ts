/**
 * HARBOR — helper compartido para el log autoritativo del paquete (ADR-0005).
 *
 * Lo usan tanto `contexts/receiving` como `contexts/cargo`: toda transición de
 * estado escribe un `CargoTimelineEntry` inmutable con `seq` monótono por
 * paquete, en la MISMA transacción que el cambio. `@@unique(packageId, seq)`
 * es la barrera final contra dos appends concurrentes.
 */
import type { Prisma } from "@prisma/client";

export async function nextTimelineSeq(tx: Prisma.TransactionClient, packageId: string): Promise<number> {
  const last = await tx.cargoTimelineEntry.findFirst({
    where: { packageId },
    orderBy: { seq: "desc" },
    select: { seq: true },
  });
  return (last?.seq ?? 0) + 1;
}

export async function appendCargoTimeline(
  tx: Prisma.TransactionClient,
  input: {
    packageId: string;
    eventType: string;
    payload?: Record<string, unknown>;
    actorUserId?: string | null;
    occurredAt?: Date;
  },
): Promise<void> {
  await tx.cargoTimelineEntry.create({
    data: {
      packageId: input.packageId,
      seq: await nextTimelineSeq(tx, input.packageId),
      eventType: input.eventType,
      payloadJson: (input.payload ?? {}) as Prisma.InputJsonValue,
      actorUserId: input.actorUserId ?? null,
      ...(input.occurredAt ? { occurredAt: input.occurredAt } : {}),
    },
  });
}
