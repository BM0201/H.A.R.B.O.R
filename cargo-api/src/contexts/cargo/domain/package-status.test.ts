import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransition,
  assertTransition,
  nextStatuses,
  transitionEffects,
  isTerminal,
  HAPPY_PATH,
} from "@/contexts/cargo/domain/package-status";

// HARBOR PASO U — máquina de estados del recorrido completo. Función pura.

test("el camino feliz avanza de a un paso", () => {
  assert.equal(canTransition("RECEIVED_ORIGIN", "CONSOLIDATED"), true);
  assert.equal(canTransition("CONSOLIDATED", "IN_TRANSIT"), true);
  assert.equal(canTransition("IN_TRANSIT", "IN_CUSTOMS"), true);
  assert.equal(canTransition("IN_CUSTOMS", "AVAILABLE"), true);
  assert.equal(canTransition("AVAILABLE", "DELIVERED"), true);
});

test("no se puede saltar etapas", () => {
  assert.equal(canTransition("RECEIVED_ORIGIN", "DELIVERED"), false);
  assert.equal(canTransition("RECEIVED_ORIGIN", "AVAILABLE"), false);
  assert.equal(canTransition("CONSOLIDATED", "AVAILABLE"), false);
});

test("IN_TRANSIT puede saltar aduana (despacho directo)", () => {
  assert.equal(canTransition("IN_TRANSIT", "AVAILABLE"), true);
});

test("incidentes (LOST/DAMAGED/RETURNED) alcanzables desde el recorrido normal", () => {
  assert.equal(canTransition("IN_TRANSIT", "LOST"), true);
  assert.equal(canTransition("AVAILABLE", "DAMAGED"), true);
  assert.equal(canTransition("DELIVERED", "RETURNED"), true);
});

test("estados terminales no avanzan (salvo DELIVERED→RETURNED y DAMAGED)", () => {
  assert.deepEqual([...nextStatuses("RETURNED")], []);
  assert.deepEqual([...nextStatuses("LOST")], []);
  assert.equal(isTerminal("DELIVERED"), true);
  assert.equal(isTerminal("RECEIVED_ORIGIN"), false);
});

test("assertTransition lanza en transición ilegal", () => {
  assert.throws(() => assertTransition("RECEIVED_ORIGIN", "DELIVERED"), /ILLEGAL_PACKAGE_TRANSITION/);
  assert.doesNotThrow(() => assertTransition("AVAILABLE", "AVAILABLE")); // no-op
});

test("transitionEffects: AVAILABLE arranca reloj + exige sucursal; DELIVERED sella entrega", () => {
  assert.deepEqual(transitionEffects("AVAILABLE"), {
    markAvailableNow: true,
    markDeliveredNow: false,
    requiresDestinationBranch: true,
  });
  assert.equal(transitionEffects("DELIVERED").markDeliveredNow, true);
  assert.equal(transitionEffects("IN_TRANSIT").requiresDestinationBranch, false);
});

test("HAPPY_PATH es la secuencia que dibuja el portal", () => {
  assert.deepEqual([...HAPPY_PATH], [
    "PRE_ALERTED",
    "RECEIVED_ORIGIN",
    "CONSOLIDATED",
    "IN_TRANSIT",
    "IN_CUSTOMS",
    "AVAILABLE",
    "DELIVERED",
  ]);
});
