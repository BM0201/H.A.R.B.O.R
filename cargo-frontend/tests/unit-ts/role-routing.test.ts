/**
 * PASO R.5 — cada rol aterriza en SU home; ninguno cae al default por accidente.
 * También verifica que el `resolveRoleHome` del frontend y el del backend
 * (copia a mano) coinciden.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { resolveRoleHome } from "@/modules/rbac/role-routing";
import { resolveRoleHome as resolveRoleHomeBackend } from "../../../cargo-api/src/modules/rbac/role-routing";

const EXPECTED: Record<string, string> = {
  SYSTEM_ADMIN: "/app/system-admin",
  OWNER: "/app/owner",
  MASTER: "/app/master",
  ACCOUNTANT: "/app/master/finance",
  BRANCH_ADMIN: "/app/branch",
  CASHIER: "/app/branch/cash",
  COUNTER: "/app/branch/dispatch",
  WAREHOUSE_ORIGIN: "/app/warehouse/receiving",
  WAREHOUSE_DESTINATION: "/app/branch/arrivals",
  COURIER: "/app/delivery",
};

test("role-routing: los 10 roles aterrizan en su home declarado", () => {
  for (const [role, home] of Object.entries(EXPECTED)) {
    assert.equal(resolveRoleHome(role), home, `${role} debería ir a ${home}`);
  }
});

test("role-routing: ningún rol conocido dispara la advertencia del default", () => {
  const original = console.warn;
  const calls: unknown[][] = [];
  console.warn = (...args: unknown[]) => { calls.push(args); };
  try {
    for (const role of Object.keys(EXPECTED)) resolveRoleHome(role);
  } finally {
    console.warn = original;
  }
  assert.deepEqual(calls, [], `un rol conocido cayó al default: ${JSON.stringify(calls)}`);
});

test("role-routing: un rol desconocido cae al default con una advertencia", () => {
  const original = console.warn;
  let warned = false;
  console.warn = () => { warned = true; };
  try {
    assert.equal(resolveRoleHome("NO_EXISTE"), "/app/branch");
  } finally {
    console.warn = original;
  }
  assert.equal(warned, true);
});

test("role-routing: frontend y backend resuelven igual (copias a mano)", () => {
  for (const role of [...Object.keys(EXPECTED), "NO_EXISTE"]) {
    const original = console.warn;
    console.warn = () => {};
    try {
      assert.equal(resolveRoleHome(role), resolveRoleHomeBackend(role), `divergen para ${role}`);
    } finally {
      console.warn = original;
    }
  }
});
