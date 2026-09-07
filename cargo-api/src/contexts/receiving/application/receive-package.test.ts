import assert from "node:assert/strict";
import test from "node:test";
import {
  createReceivePackage,
  DuplicateTrackingError,
  AmbiguousMatchError,
  ModeMismatchError,
} from "@/contexts/receiving/application/receive-package";
import type { ReceivingRepository, PersistReceivedInput, OpenPreAlert } from "@/contexts/receiving/application/ports";
import type { Quote } from "@/contexts/rating";

// HARBOR PASO S.2 — el caso de uso de recepción, con repo y cotizador falsos.

function makeRepo(preAlerts: OpenPreAlert[], existing: Set<string> = new Set()) {
  const persisted: PersistReceivedInput[] = [];
  const repo: ReceivingRepository = {
    async findExistingPackageByNormalizedTracking(n) {
      return existing.has(n) ? { id: "existing", trackingCode: "OLDCODE" } : null;
    },
    async findOpenPreAlertsByNormalizedTracking(n) {
      return preAlerts.filter((p) => p.originTrackingNumber === n);
    },
    async reserveTrackingCode(candidate) {
      return candidate();
    },
    async persistReceived(input) {
      persisted.push(input);
      return {
        id: "pkg1",
        trackingCode: input.trackingCode,
        status: input.status,
        mode: input.mode,
        customerId: input.customerId,
        weightOriginLb: input.measurement?.weightOriginLb ?? null,
        chargeableLb: input.measurement?.chargeableLb ?? null,
        quoteSubtotal: input.quote?.subtotal ?? null,
        quoteCurrency: input.quote?.currency ?? null,
      };
    },
    // resto sin usar en estos tests
    listOrphans: async () => [],
    activeCustomersForRanking: async () => [],
    getPackageForAssignment: async () => null,
    assignOrphan: async () => {
      throw new Error("nope");
    },
    getPackageForMeasure: async () => null,
    applyMeasurement: async () => {
      throw new Error("nope");
    },
    openMeasureCorrectionApproval: async () => ({ approvalRequestId: "x", created: true }),
  };
  return { repo, persisted };
}

const quoter = {
  async quote(): Promise<Quote> {
    return { rateCardId: "r1", pricePerLb: 6, volumetricLb: 0, chargeableLb: 4, subtotal: 24, currency: "USD" };
  },
};

const preAlert = (o: Partial<OpenPreAlert> = {}): OpenPreAlert => ({
  id: "pa1",
  customerId: "cust1",
  mode: "AIR",
  originTrackingNumber: "TBA123456789012",
  ...o,
});

test("match único auto-asigna, marca emitir evento y liga la pre-alerta", async () => {
  const { repo, persisted } = makeRepo([preAlert()]);
  const receive = createReceivePackage({ repo, quoter });

  const res = await receive({
    rawBarcode: "TBA123456789012",
    labelRecipientRaw: "AirBmCargo Juan Perez",
    receivedByUserId: "u1",
    weightOriginLb: 4,
    weightSource: "SCALE",
  });

  assert.equal(res.outcome, "ASSIGNED");
  assert.equal(persisted[0].status, "RECEIVED_ORIGIN");
  assert.equal(persisted[0].customerId, "cust1");
  assert.equal(persisted[0].preAlertId, "pa1");
  assert.equal(persisted[0].emitReceivedEvent, true);
  assert.equal(persisted[0].quote?.subtotal, 24);
});

test("modalidad discrepante NO auto-asigna — lanza ModeMismatchError", async () => {
  const { repo, persisted } = makeRepo([preAlert({ mode: "AIR" })]);
  const receive = createReceivePackage({ repo, quoter });

  await assert.rejects(
    receive({
      rawBarcode: "TBA123456789012",
      labelRecipientRaw: "MarBmCargo Juan Perez", // etiqueta dice SEA
      receivedByUserId: "u1",
    }),
    ModeMismatchError,
  );
  assert.equal(persisted.length, 0, "no debió persistir nada");
});

test("con override, la discrepancia se recibe con la modalidad de la etiqueta y deja marca", async () => {
  const { repo, persisted } = makeRepo([preAlert({ mode: "AIR" })]);
  const receive = createReceivePackage({ repo, quoter });

  const res = await receive({
    rawBarcode: "TBA123456789012",
    labelRecipientRaw: "MarBmCargo Juan Perez",
    receivedByUserId: "u1",
    overrideModeMismatch: true,
  });

  assert.equal(res.outcome, "MODE_REVIEW");
  assert.equal(persisted[0].mode, "SEA");
  assert.deepEqual(persisted[0].modeMismatch, { preAlertMode: "AIR", labelMode: "SEA" });
});

test("sin match → ORPHAN; el OCR del nombre NO asigna dueño ni emite evento", async () => {
  const { repo, persisted } = makeRepo([]); // ninguna pre-alerta
  const receive = createReceivePackage({ repo, quoter });

  const res = await receive({
    rawBarcode: "1Z999AA10123456784",
    labelRecipientRaw: "AirBmCargo Juan Perez", // nombre presente — no debe asignar
    receivedByUserId: "u1",
  });

  assert.equal(res.outcome, "ORPHAN");
  assert.equal(persisted[0].status, "ORPHAN");
  assert.equal(persisted[0].customerId, null);
  assert.equal(persisted[0].emitReceivedEvent, false);
});

test("tracking ya usado → DuplicateTrackingError, no persiste", async () => {
  const { repo, persisted } = makeRepo([preAlert()], new Set(["TBA123456789012"]));
  const receive = createReceivePackage({ repo, quoter });

  await assert.rejects(
    receive({ rawBarcode: "TBA123456789012", receivedByUserId: "u1" }),
    DuplicateTrackingError,
  );
  assert.equal(persisted.length, 0);
});

test("dos pre-alertas del mismo tracking → AmbiguousMatchError", async () => {
  const { repo } = makeRepo([preAlert({ id: "pa1", customerId: "a" }), preAlert({ id: "pa2", customerId: "b" })]);
  const receive = createReceivePackage({ repo, quoter });
  await assert.rejects(receive({ rawBarcode: "TBA123456789012", receivedByUserId: "u1" }), AmbiguousMatchError);
});
