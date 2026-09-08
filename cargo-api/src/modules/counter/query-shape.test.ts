import assert from "node:assert/strict";
import test from "node:test";
import { classifyCounterQuery } from "@/modules/counter/service";

// HARBOR PASO U.2 — un solo campo resuelve por forma. Clasificación pura.

test("número de casillero", () => {
  assert.equal(classifyCounterQuery("NIC-00001"), "casillero");
  assert.equal(classifyCounterQuery("nic00001"), "casillero");
  assert.equal(classifyCounterQuery("MGA-123"), "casillero");
});

test("tracking del carrier (tiene dígitos y es largo)", () => {
  assert.equal(classifyCounterQuery("1Z999AA10123456784"), "tracking");
  assert.equal(classifyCounterQuery("9405 5036 9930 0001 2345 67"), "tracking");
  assert.equal(classifyCounterQuery("TBA123456789012"), "tracking");
});

test("nombre", () => {
  assert.equal(classifyCounterQuery("Bayardo Mendoza"), "name");
  assert.equal(classifyCounterQuery("Maria"), "name");
});

test("muy corto", () => {
  assert.equal(classifyCounterQuery("a"), "too-short");
  assert.equal(classifyCounterQuery(" "), "too-short");
});
