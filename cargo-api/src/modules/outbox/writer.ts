/**
 * HARBOR PASO S — Outbox transaccional (ADR-0006).
 *
 * `writeOutboxEvent` se llama DENTRO de la misma `$transaction` que el cambio
 * de estado del agregado. Si la tx se revierte, el evento se va con ella —
 * nunca se publica algo que no ocurrió. El despachador (`dispatcher.ts`) lo
 * publica after-commit, at-least-once.
 */
import type { Prisma } from "@prisma/client";

export type OutboxEventInput = {
  eventType: string; // p.ej. "receiving.package_received.v1"
  aggregateType: string; // "Package"
  aggregateId: string;
  payload: Record<string, unknown>;
  occurredAt?: Date;
};

export async function writeOutboxEvent(tx: Prisma.TransactionClient, input: OutboxEventInput): Promise<string> {
  const row = await tx.outboxEvent.create({
    data: {
      eventType: input.eventType,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      payloadJson: input.payload as Prisma.InputJsonValue,
      occurredAt: input.occurredAt ?? new Date(),
    },
    select: { id: true },
  });
  return row.id;
}
