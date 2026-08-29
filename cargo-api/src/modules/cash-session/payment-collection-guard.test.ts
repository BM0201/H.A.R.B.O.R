import assert from "node:assert/strict";
import test from "node:test";
import { decideCollect, CashSessionRequiredError } from "@/modules/cash-session/payment-collection-guard";

// PASO R.3 — la regla pura: capacidad + gaveta abierta.

test("decideCollect: sin la capacidad → FORBIDDEN (403)", () => {
  assert.equal(
    decideCollect({ hasCollectCapability: false, hasOpenCashSession: true, isPrivilegedGlobal: false }),
    "FORBIDDEN",
  );
});

test("decideCollect: con la capacidad pero sin gaveta → CASH_SESSION_REQUIRED (409, no 403)", () => {
  assert.equal(
    decideCollect({ hasCollectCapability: true, hasOpenCashSession: false, isPrivilegedGlobal: false }),
    "CASH_SESSION_REQUIRED",
  );
});

test("decideCollect: capacidad + gaveta abierta → OK", () => {
  assert.equal(
    decideCollect({ hasCollectCapability: true, hasOpenCashSession: true, isPrivilegedGlobal: false }),
    "OK",
  );
});

test("decideCollect: un global privilegiado cobra sin gaveta (supervisor, no cajero)", () => {
  assert.equal(
    decideCollect({ hasCollectCapability: false, hasOpenCashSession: false, isPrivilegedGlobal: true }),
    "OK",
  );
});

test("CashSessionRequiredError lleva el código que http.ts mapea a 409", () => {
  const e = new CashSessionRequiredError();
  assert.equal(e.message, "CASH_SESSION_REQUIRED");
  assert.ok(e instanceof Error);
});
