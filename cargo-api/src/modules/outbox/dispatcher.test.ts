import assert from "node:assert/strict";
import test from "node:test";
import { dispatchWithStore, type OutboxStore } from "@/modules/outbox/dispatcher";
import type { Consumer, OutboxEventRecord } from "@/modules/outbox/consumers";

// HARBOR PASO S.4 — despachador del outbox. Idempotencia por (evento, consumidor).

function makeStore(events: OutboxEventRecord[]): OutboxStore & { processed: string[]; deliveries: string[] } {
  const processed: string[] = [];
  const deliveries: string[] = [];
  return {
    processed,
    deliveries,
    async listPending() {
      return events.filter((e) => !processed.includes(e.id));
    },
    async hasDelivery(eventId, consumer) {
      return deliveries.includes(`${eventId}:${consumer}`);
    },
    async recordDelivery(eventId, consumer) {
      deliveries.push(`${eventId}:${consumer}`);
    },
    async markProcessed(eventId) {
      processed.push(eventId);
    },
    async recordFailure() {
      /* noop */
    },
  };
}

const ev: OutboxEventRecord = {
  id: "e1",
  eventType: "receiving.package_received.v1",
  aggregateType: "Package",
  aggregateId: "pkg1",
  payloadJson: { customerId: "c1", trackingCode: "WASRXA" },
};

test("entrega el evento a su consumidor y lo marca procesado", async () => {
  let calls = 0;
  const consumer: Consumer = {
    name: "test-consumer",
    handles: (t) => t === "receiving.package_received.v1",
    handle: async () => {
      calls += 1;
    },
  };
  const store = makeStore([ev]);
  const r = await dispatchWithStore(store, { consumers: [consumer] });

  assert.equal(calls, 1);
  assert.equal(r.processed, 1);
  assert.equal(r.deliveries, 1);
  assert.deepEqual(store.processed, ["e1"]);
});

test("entrega duplicada: una segunda corrida NO vuelve a llamar al consumidor", async () => {
  let calls = 0;
  const consumer: Consumer = {
    name: "test-consumer",
    handles: () => true,
    handle: async () => {
      calls += 1;
    },
  };
  const store = makeStore([ev]);
  // simulamos que el evento se re-encoló (processedAt se limpió) pero la
  // entrega ya quedó registrada
  await dispatchWithStore(store, { consumers: [consumer] });
  store.processed.length = 0; // "reaparece" como pendiente
  const r2 = await dispatchWithStore(store, { consumers: [consumer] });

  assert.equal(calls, 1, "el consumidor idempotente no se re-ejecuta");
  assert.equal(r2.deliveries, 0);
  assert.equal(r2.processed, 1, "igual se re-marca procesado");
});

test("si el consumidor falla, el evento NO se marca procesado (at-least-once)", async () => {
  const consumer: Consumer = {
    name: "flaky",
    handles: () => true,
    handle: async () => {
      throw new Error("boom");
    },
  };
  const store = makeStore([ev]);
  const r = await dispatchWithStore(store, { consumers: [consumer] });

  assert.equal(r.failures, 1);
  assert.equal(r.processed, 0);
  assert.deepEqual(store.processed, []);
});

test("evento sin consumidor aplicable se marca procesado igual (no queda colgado)", async () => {
  const consumer: Consumer = { name: "other", handles: (t) => t === "otro.evento", handle: async () => {} };
  const store = makeStore([ev]);
  const r = await dispatchWithStore(store, { consumers: [consumer] });
  assert.equal(r.processed, 1);
  assert.equal(r.deliveries, 0);
});
