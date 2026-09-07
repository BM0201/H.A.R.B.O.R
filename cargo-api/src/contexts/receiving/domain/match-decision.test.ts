import assert from "node:assert/strict";
import test from "node:test";
import { decideMatch, type OpenPreAlert } from "@/contexts/receiving/domain/match-decision";

// HARBOR PASO S.2 — la decisión del match. Función pura. La llave es el tracking.

const pa = (over: Partial<OpenPreAlert> = {}): OpenPreAlert => ({
  id: "pa1",
  customerId: "cust1",
  mode: "AIR",
  originTrackingNumber: "TBA123456789012",
  ...over,
});

test("match único con modalidad coincidente → ASSIGN", () => {
  const d = decideMatch("TBA123456789012", [pa()], "AIR");
  assert.equal(d.kind, "ASSIGN");
  if (d.kind === "ASSIGN") {
    assert.equal(d.customerId, "cust1");
    assert.equal(d.preAlertId, "pa1");
  }
});

test("match único sin modalidad en la etiqueta → ASSIGN con la de la pre-alerta", () => {
  const d = decideMatch("TBA123456789012", [pa({ mode: "SEA" })], null);
  assert.equal(d.kind, "ASSIGN");
  if (d.kind === "ASSIGN") assert.equal(d.mode, "SEA");
});

test("modalidad discrepante (pre-alerta AIR, etiqueta SEA) → MODE_MISMATCH, NO asigna", () => {
  const d = decideMatch("TBA123456789012", [pa({ mode: "AIR" })], "SEA");
  assert.equal(d.kind, "MODE_MISMATCH");
  if (d.kind === "MODE_MISMATCH") {
    assert.equal(d.preAlertMode, "AIR");
    assert.equal(d.labelMode, "SEA");
  }
});

test("sin pre-alerta con ese tracking → ORPHAN", () => {
  const d = decideMatch("TBA999999999999", [pa()], "AIR");
  assert.equal(d.kind, "ORPHAN");
});

test("tracking distinto no matchea aunque haya pre-alertas → ORPHAN", () => {
  const d = decideMatch("1Z999AA1012345678", [pa()], null);
  assert.equal(d.kind, "ORPHAN");
});

test("dos pre-alertas de clientes distintos con el mismo tracking → AMBIGUOUS, nunca elige una", () => {
  const d = decideMatch("TBA123456789012", [pa({ id: "pa1", customerId: "a" }), pa({ id: "pa2", customerId: "b" })], "AIR");
  assert.equal(d.kind, "AMBIGUOUS");
  if (d.kind === "AMBIGUOUS") assert.deepEqual(d.preAlertIds.sort(), ["pa1", "pa2"]);
});

test("el nombre NUNCA entra en la decisión — decideMatch no recibe nombres", () => {
  // Garantía estructural: la firma de decideMatch es (tracking, preAlerts, labelMode).
  // No hay parámetro de nombre. Un match sólo puede salir de un tracking igual.
  const d = decideMatch("NO-MATCH", [pa()], "AIR");
  assert.equal(d.kind, "ORPHAN");
});
