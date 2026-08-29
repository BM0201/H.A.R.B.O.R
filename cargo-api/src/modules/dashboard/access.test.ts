import assert from "node:assert/strict";
import test from "node:test";
import type { RoleCode } from "@prisma/client";
import type { SessionPayload } from "@/types/auth";
import { resolveBranchDashboardAccess } from "@/modules/dashboard/access";

const enabledModules = { enableCashier: true, enableDispatch: true };

function session(overrides: Partial<SessionPayload> = {}): SessionPayload {
  return {
    userId: "user-1",
    username: "user",
    globalRoles: [],
    branchMemberships: [{ branchId: "branch-a", roleCode: "COUNTER" }],
    primaryBranchId: "branch-a",
    roleCode: "COUNTER",
    branchIds: ["branch-a"],
    sessionVersion: 0,
    exp: 9999999999,
    ...overrides,
  };
}

test("branch user cannot view another branch dashboard", () => {
  assert.throws(
    () => resolveBranchDashboardAccess({
      session: session(),
      requestedBranchId: "branch-b",
      moduleConfig: enabledModules,
    }),
    /FORBIDDEN_BRANCH/,
  );
});

test("counter user cannot force cashier view via client role", () => {
  const access = resolveBranchDashboardAccess({
    session: session({ roleCode: "COUNTER" }),
    requestedBranchId: "branch-a",
    moduleConfig: enabledModules,
  });

  assert.equal(access.kind, "SALES");
});

test("user without a valid branch receives forbidden", () => {
  assert.throws(
    () => resolveBranchDashboardAccess({
      session: session({
        branchMemberships: [],
        branchIds: [],
        primaryBranchId: null,
      }),
      moduleConfig: enabledModules,
    }),
    /FORBIDDEN_BRANCH/,
  );
});

test("global admin can inspect a requested branch as branch admin view", () => {
  const access = resolveBranchDashboardAccess({
    session: session({
      globalRoles: ["SYSTEM_ADMIN" as RoleCode],
      branchMemberships: [],
      branchIds: [],
      primaryBranchId: null,
      roleCode: "SYSTEM_ADMIN",
    }),
    requestedBranchId: "branch-b",
    moduleConfig: enabledModules,
  });

  assert.deepEqual(access, { branchId: "branch-b", kind: "BRANCH_ADMIN" });
});

test("module-disabled role dashboard is forbidden", () => {
  assert.throws(
    () => resolveBranchDashboardAccess({
      session: session({
        branchMemberships: [{ branchId: "branch-a", roleCode: "CASHIER" }],
        roleCode: "CASHIER",
      }),
      requestedBranchId: "branch-a",
      moduleConfig: { enableCashier: false, enableDispatch: true },
    }),
    /FORBIDDEN_MODULE_DISABLED/,
  );
});
