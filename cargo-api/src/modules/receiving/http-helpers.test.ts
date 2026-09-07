import assert from "node:assert/strict";
import test from "node:test";
import type { SessionPayload } from "@/types/auth";
import { canMeasureAt, canCorrectMeasureAt, resolveOriginBranch } from "@/modules/receiving/http-helpers";

// HARBOR PASO S.3 / PASO R.6 — frontera antifraude en la RUTA, no solo en la UI.
// Ya existe `Package`, así que el test que PASO R dejó como `todo` se puede
// escribir: quien no es bodega-origen recibe 403 al intentar pesar.

function session(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    userId: "u1",
    username: "test",
    globalRoles: [],
    branchMemberships: [{ branchId: "mia", roleCode: "WAREHOUSE_ORIGIN" }],
    primaryBranchId: "mia",
    roleCode: "WAREHOUSE_ORIGIN",
    branchIds: ["mia"],
    sessionVersion: 0,
    exp: 9999999999,
    ...overrides,
  };
}

test("WAREHOUSE_ORIGIN puede pesar en su sucursal", () => {
  assert.equal(canMeasureAt(session(), "mia"), true);
});

test("WAREHOUSE_DESTINATION NO puede pesar — 403, no solo botón oculto", () => {
  const s = session({
    branchMemberships: [{ branchId: "mga", roleCode: "WAREHOUSE_DESTINATION" }],
    roleCode: "WAREHOUSE_DESTINATION",
    branchIds: ["mga"],
    primaryBranchId: "mga",
  });
  assert.equal(canMeasureAt(s, "mga"), false);
  assert.equal(canCorrectMeasureAt(s, "mga"), false);
});

test("COURIER NO puede pesar ni corregir", () => {
  const s = session({
    branchMemberships: [{ branchId: "mga", roleCode: "COURIER" }],
    roleCode: "COURIER",
    branchIds: ["mga"],
    primaryBranchId: "mga",
  });
  assert.equal(canMeasureAt(s, "mga"), false);
  assert.equal(canCorrectMeasureAt(s, "mga"), false);
});

test("solo los globales superiores corrigen el peso (package.measure.correct)", () => {
  assert.equal(canCorrectMeasureAt(session(), "mia"), false); // WAREHOUSE_ORIGIN no corrige
  assert.equal(canCorrectMeasureAt(session({ globalRoles: ["MASTER"] }), "mia"), true);
  assert.equal(canCorrectMeasureAt(session({ globalRoles: ["OWNER"] }), "mia"), true);
});

test("MASTER pesa sin sucursal (supervisor), WAREHOUSE_ORIGIN de otra sucursal no", () => {
  assert.equal(canMeasureAt(session({ globalRoles: ["MASTER"] }), null), true);
  assert.equal(canMeasureAt(session(), "otra-sucursal"), false);
});

test("resolveOriginBranch: sin sucursal provista toma la primera con package.receive", () => {
  const r = resolveOriginBranch(session(), null);
  assert.deepEqual(r, { branchId: "mia" });
});

test("resolveOriginBranch: sucursal provista sin permiso → FORBIDDEN_BRANCH", () => {
  const r = resolveOriginBranch(session(), "ajena");
  assert.deepEqual(r, { error: "FORBIDDEN_BRANCH" });
});

test("resolveOriginBranch: rol sin recepción y sin sucursal → NO_RECEIVING_BRANCH", () => {
  const s = session({
    branchMemberships: [{ branchId: "mga", roleCode: "CASHIER" }],
    roleCode: "CASHIER",
    branchIds: ["mga"],
    primaryBranchId: "mga",
  });
  assert.deepEqual(resolveOriginBranch(s, null), { error: "NO_RECEIVING_BRANCH" });
});
