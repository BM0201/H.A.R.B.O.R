/**
 * HARBOR PASO S.4 — Despachador del outbox (ADR-0006).
 *
 * Corre por cron (`/api/system/cron/outbox-dispatch`). Lee eventos sin
 * `processedAt`, los entrega a cada consumidor que los maneja, registra un
 * `OutboxDelivery` por (evento, consumidor) y marca `processedAt` cuando TODOS
 * los consumidores aplicables terminaron. At-least-once: si un consumidor
 * falla, el evento queda sin marcar y se reintenta en la próxima corrida.
 *
 * La lógica de despacho es pura sobre un `OutboxStore` inyectable — el store
 * Prisma es el default, pero un fake permite testear la idempotencia sin base.
 */
import { prisma } from "@/lib/prisma";
import { CONSUMERS, type Consumer, type OutboxEventRecord } from "@/modules/outbox/consumers";

export type DispatchResult = {
  scanned: number;
  processed: number;
  deliveries: number;
  failures: number;
};

export type OutboxStore = {
  listPending(limit: number): Promise<OutboxEventRecord[]>;
  hasDelivery(eventId: string, consumer: string): Promise<boolean>;
  recordDelivery(eventId: string, consumer: string): Promise<void>;
  markProcessed(eventId: string): Promise<void>;
  recordFailure(eventId: string, error: string): Promise<void>;
};

const DEFAULT_BATCH = 100;
const MAX_ATTEMPTS = 25;

async function deliverOne(
  store: OutboxStore,
  event: OutboxEventRecord,
  consumers: readonly Consumer[],
): Promise<{ ok: boolean; delivered: number }> {
  const applicable = consumers.filter((c) => c.handles(event.eventType));
  let delivered = 0;
  let allOk = true;

  for (const consumer of applicable) {
    if (await store.hasDelivery(event.id, consumer.name)) continue;
    try {
      await consumer.handle(event);
      await store.recordDelivery(event.id, consumer.name);
      delivered += 1;
    } catch (err) {
      allOk = false;
      await store.recordFailure(event.id, err instanceof Error ? err.message.slice(0, 500) : String(err).slice(0, 500));
    }
  }

  return { ok: allOk, delivered };
}

export async function dispatchWithStore(
  store: OutboxStore,
  opts: { batchSize?: number; consumers?: readonly Consumer[] } = {},
): Promise<DispatchResult> {
  const consumers = opts.consumers ?? CONSUMERS;
  const pending = await store.listPending(opts.batchSize ?? DEFAULT_BATCH);

  const result: DispatchResult = { scanned: pending.length, processed: 0, deliveries: 0, failures: 0 };

  for (const event of pending) {
    const { ok, delivered } = await deliverOne(store, event, consumers);
    result.deliveries += delivered;
    if (ok) {
      await store.markProcessed(event.id);
      result.processed += 1;
    } else {
      result.failures += 1;
    }
  }

  return result;
}

/** Store Prisma real (el default de producción). */
function prismaStore(): OutboxStore {
  return {
    async listPending(limit) {
      return prisma.outboxEvent.findMany({
        where: { processedAt: null, attempts: { lt: MAX_ATTEMPTS } },
        orderBy: { occurredAt: "asc" },
        take: limit,
        select: { id: true, eventType: true, aggregateType: true, aggregateId: true, payloadJson: true },
      });
    },
    async hasDelivery(eventId, consumer) {
      const row = await prisma.outboxDelivery.findUnique({
        where: { eventId_consumer: { eventId, consumer } },
        select: { id: true },
      });
      return row != null;
    },
    async recordDelivery(eventId, consumer) {
      await prisma.outboxDelivery.create({ data: { eventId, consumer } });
    },
    async markProcessed(eventId) {
      await prisma.outboxEvent.update({ where: { id: eventId }, data: { processedAt: new Date() } });
    },
    async recordFailure(eventId, error) {
      await prisma.outboxEvent.update({
        where: { id: eventId },
        data: { attempts: { increment: 1 }, lastError: error },
      });
    },
  };
}

export async function dispatchPendingOutbox(
  opts: { batchSize?: number; consumers?: readonly Consumer[] } = {},
): Promise<DispatchResult> {
  return dispatchWithStore(prismaStore(), opts);
}
