import assert from "node:assert/strict";
import test from "node:test";
import { can, CAPABILITIES } from "@/modules/rbac/policies";

// PASO R.1b — el test viejo probaba el flujo POS (BRANCH_ADMIN puede vender),
// amputado en la Fase 0.2. Reemplazado por lo que importa en HARBOR: la
// frontera antifraude y el reparto de capacidades de bodega.

test("rbac: la frontera antifraude está en el catálogo — solo ORIGEN pesa", () => {
  assert.equal(can("WAREHOUSE_ORIGIN", CAPABILITIES.PACKAGE_MEASURE), true);
  assert.equal(can("WAREHOUSE_DESTINATION", CAPABILITIES.PACKAGE_MEASURE), false);
  assert.equal(can("WAREHOUSE_DESTINATION", CAPABILITIES.PACKAGE_MEASURE_CORRECT), false);
});

test("rbac: bodega DESTINO entrega, bodega ORIGEN no", () => {
  assert.equal(can("WAREHOUSE_DESTINATION", CAPABILITIES.PACKAGE_DELIVER), true);
  assert.equal(can("WAREHOUSE_DESTINATION", CAPABILITIES.PACKAGE_RELEASE), true);
  assert.equal(can("WAREHOUSE_ORIGIN", CAPABILITIES.PACKAGE_DELIVER), false);
});

test("rbac: COUNTER da de alta clientes y pre-alertas; no toca caja de cierre", () => {
  assert.equal(can("COUNTER", CAPABILITIES.CUSTOMER_CREATE), true);
  assert.equal(can("COUNTER", CAPABILITIES.PREALERT_CREATE), true);
  assert.equal(can("COUNTER", CAPABILITIES.CASH_SESSION_CLOSE_FINAL), false);
});

test("rbac: MASTER tiene el catálogo courier completo; SYSTEM_ADMIN no autoriza su propio módulo dos veces", () => {
  assert.equal(can("MASTER", CAPABILITIES.SHIPMENT_COST_EDIT), true);
  assert.equal(can("MASTER", CAPABILITIES.CUSTOMS_CLEAR), true);
  assert.equal(can("MASTER", CAPABILITIES.SYSTEM_ADMIN_SETTINGS), false);
});

test("rbac: COURIER entrega y marca; aguas abajo de la frontera antifraude no pesa ni recibe", () => {
  assert.equal(can("COURIER", CAPABILITIES.PACKAGE_DELIVER), true);
  assert.equal(can("COURIER", CAPABILITIES.DISPATCH_MARK), true);
  assert.equal(can("COURIER", CAPABILITIES.PACKAGE_MEASURE), false);
  assert.equal(can("COURIER", CAPABILITIES.PACKAGE_RECEIVE), false);
  assert.equal(can("COURIER", CAPABILITIES.PACKAGE_CONSOLIDATE), false);
});

test("rbac: cobrar es capacidad (PASO R.3) — COUNTER/CASHIER/COURIER la tienen; bodega no", () => {
  for (const role of ["COUNTER", "CASHIER", "COURIER"] as const) {
    assert.equal(can(role, CAPABILITIES.PAYMENT_COLLECT), true, `${role} debería poder cobrar`);
  }
  assert.equal(can("WAREHOUSE_ORIGIN", CAPABILITIES.PAYMENT_COLLECT), false);
  assert.equal(can("WAREHOUSE_DESTINATION", CAPABILITIES.PAYMENT_COLLECT), false);
});

test("rbac: quien anda en la calle con plata NO cierra su cadena de custodia", () => {
  // custody.handoff (entregar) sí; custody.receive (confirmar) no.
  assert.equal(can("COURIER", CAPABILITIES.CUSTODY_HANDOFF), true);
  assert.equal(can("COUNTER", CAPABILITIES.CUSTODY_HANDOFF), true);
  assert.equal(can("COURIER", CAPABILITIES.CUSTODY_RECEIVE), false);
  assert.equal(can("COUNTER", CAPABILITIES.CUSTODY_RECEIVE), false);
  assert.equal(can("CASHIER", CAPABILITIES.CUSTODY_RECEIVE), true);
});

test("rbac: entrega en mostrador vs última milla (PASO R.3)", () => {
  assert.equal(can("COUNTER", CAPABILITIES.DELIVERY_HANDOVER), true);
  assert.equal(can("WAREHOUSE_DESTINATION", CAPABILITIES.DELIVERY_HANDOVER), true);
  assert.equal(can("COURIER", CAPABILITIES.DELIVERY_HANDOVER), false);
  assert.equal(can("COURIER", CAPABILITIES.DELIVERY_LASTMILE), true);
  assert.equal(can("COUNTER", CAPABILITIES.DELIVERY_LASTMILE), false);
});
