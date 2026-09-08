import assert from "node:assert/strict";
import test from "node:test";
import {
  generateCode,
  hashCode,
  codeHashMatches,
  verifyChallenge,
  challengeExpiry,
  MAX_ATTEMPTS,
} from "@/modules/portal/challenge";

// HARBOR PASO U.0 — lógica pura del código de un solo uso.

test("generateCode: 6 dígitos", () => {
  for (let i = 0; i < 100; i++) assert.match(generateCode(), /^\d{6}$/);
});

test("codeHashMatches: tiempo constante, sólo el código correcto cuadra", () => {
  const h = hashCode("123456");
  assert.equal(codeHashMatches("123456", h), true);
  assert.equal(codeHashMatches("123457", h), false);
  assert.equal(codeHashMatches("", h), false);
});

const base = () => ({ codeHash: hashCode("424242"), attempts: 0, consumedAt: null as Date | null, expiresAt: challengeExpiry() });

test("verifyChallenge: código correcto → ok", () => {
  assert.deepEqual(verifyChallenge(base(), "424242"), { ok: true });
});

test("verifyChallenge: sin challenge → NO_CHALLENGE", () => {
  assert.deepEqual(verifyChallenge(null, "424242"), { ok: false, reason: "NO_CHALLENGE" });
});

test("verifyChallenge: ya consumido → CONSUMED (no reutilizable)", () => {
  assert.deepEqual(verifyChallenge({ ...base(), consumedAt: new Date() }, "424242"), { ok: false, reason: "CONSUMED" });
});

test("verifyChallenge: vencido a los 10 min → EXPIRED", () => {
  const c = { ...base(), expiresAt: new Date(Date.now() - 1000) };
  assert.deepEqual(verifyChallenge(c, "424242"), { ok: false, reason: "EXPIRED" });
});

test("verifyChallenge: 5 intentos máximo → TOO_MANY_ATTEMPTS", () => {
  assert.deepEqual(verifyChallenge({ ...base(), attempts: MAX_ATTEMPTS }, "424242"), {
    ok: false,
    reason: "TOO_MANY_ATTEMPTS",
  });
});

test("verifyChallenge: código incorrecto → BAD_CODE", () => {
  assert.deepEqual(verifyChallenge(base(), "000000"), { ok: false, reason: "BAD_CODE" });
});
