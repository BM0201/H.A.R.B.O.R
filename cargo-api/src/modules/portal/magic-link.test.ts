import assert from "node:assert/strict";
import test from "node:test";
import { createMagicLinkToken, verifyMagicLinkToken, MAGIC_LINK_TTL_DAYS } from "@/modules/portal/magic-link";

// HARBOR PASO U.0 — enlace directo firmado con vencimiento (7 días).

test("token recién creado → válido, devuelve el customerId", () => {
  const t = createMagicLinkToken("cust_abc");
  assert.deepEqual(verifyMagicLinkToken(t), { valid: true, customerId: "cust_abc" });
});

test("firma alterada → BAD_SIGNATURE (nunca autentica)", () => {
  const t = createMagicLinkToken("cust_abc");
  const tampered = t.slice(0, -3) + "xxx";
  assert.equal(verifyMagicLinkToken(tampered).valid, false);
});

test("payload alterado (otro customerId) → BAD_SIGNATURE", () => {
  const [, sig] = createMagicLinkToken("cust_abc").split(".");
  const fakePayload = Buffer.from(JSON.stringify({ c: "cust_OTHER", e: 9999999999 })).toString("base64url");
  assert.equal(verifyMagicLinkToken(`${fakePayload}.${sig}`).valid, false);
});

test("token vencido → EXPIRED (el frontend manda al ingreso, no a error)", () => {
  const past = new Date(Date.now() - (MAGIC_LINK_TTL_DAYS + 1) * 86_400_000);
  const t = createMagicLinkToken("cust_abc", past);
  assert.deepEqual(verifyMagicLinkToken(t), { valid: false, reason: "EXPIRED" });
});

test("basura → MALFORMED", () => {
  assert.equal(verifyMagicLinkToken("no-es-un-token").valid, false);
  assert.equal(verifyMagicLinkToken("").valid, false);
});
