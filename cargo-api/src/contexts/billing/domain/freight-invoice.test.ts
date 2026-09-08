import assert from "node:assert/strict";
import test from "node:test";
import { buildFreightInvoice, type FreightQuoteSnapshot } from "@/contexts/billing/domain/freight-invoice";

// HARBOR PASO U.3 — factura de flete desde el snapshot. Función pura.

const snap = (o: Partial<FreightQuoteSnapshot> = {}): FreightQuoteSnapshot => ({
  packageId: "p1",
  trackingCode: "WASRXA",
  mode: "AIR",
  pricePerLb: 6,
  chargeableLb: 4,
  freightSubtotal: 24,
  storageAmount: 0,
  categoryAmount: 0,
  currency: "USD",
  ...o,
});

test("un paquete: flete = subtotal, almacenaje 0, categoría 0, total = flete", () => {
  const inv = buildFreightInvoice([snap()]);
  assert.equal(inv.freightTotal, 24);
  assert.equal(inv.storageTotal, 0);
  assert.equal(inv.grandTotal, 24);
  assert.equal(inv.lines[0].label, "Flete aéreo 4.0 lb × 6.00/lb");
});

test("multi-paquete: total sobre la suma", () => {
  const inv = buildFreightInvoice([snap({ freightSubtotal: 24 }), snap({ packageId: "p2", freightSubtotal: 9 })]);
  assert.equal(inv.grandTotal, 33);
  assert.equal(inv.lines.length, 2);
});

test("almacenaje entra al total cuando el snapshot lo trae", () => {
  const inv = buildFreightInvoice([snap({ storageAmount: 5 })]);
  assert.equal(inv.storageTotal, 5);
  assert.equal(inv.grandTotal, 29);
});

test("monedas mezcladas → lanza", () => {
  assert.throws(() => buildFreightInvoice([snap({ currency: "USD" }), snap({ currency: "NIO" })]), /MIXED_CURRENCY/);
});

test("sin paquetes → lanza", () => {
  assert.throws(() => buildFreightInvoice([]), /EMPTY_INVOICE/);
});

test("redondeo a 2 decimales", () => {
  const inv = buildFreightInvoice([snap({ pricePerLb: 2.5, chargeableLb: 3.333, freightSubtotal: 8.3325 })]);
  assert.equal(inv.grandTotal, 8.33);
});
