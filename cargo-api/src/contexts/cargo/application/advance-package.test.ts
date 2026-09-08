import assert from "node:assert/strict";
import test from "node:test";
import { createAdvancePackage, type CargoRepository } from "@/contexts/cargo/application/advance-package";
import type { PackageStatus } from "@/contexts/cargo/domain/package-status";

// HARBOR PASO U — caso de uso de transición manual, con repo falso.

function makeRepo(status: PackageStatus, customerId: string | null = "cust1") {
  const applied: unknown[] = [];
  const repo: CargoRepository = {
    async getForTransition() {
      return { id: "pkg1", trackingCode: "WASRXA", status, customerId, currentBranchId: "mia" };
    },
    async applyTransition(input) {
      applied.push(input);
      return { id: "pkg1", trackingCode: "WASRXA", status: input.to, currentBranchId: input.setCurrentBranchId ?? "mia" };
    },
  };
  return { repo, applied };
}

test("transición válida se aplica", async () => {
  const { repo, applied } = makeRepo("RECEIVED_ORIGIN");
  const advance = createAdvancePackage({ repo });
  const r = await advance({ packageId: "pkg1", to: "CONSOLIDATED", actorUserId: "u1" });
  assert.equal(r.status, "CONSOLIDATED");
  assert.equal(applied.length, 1);
});

test("transición ilegal lanza y NO aplica", async () => {
  const { repo, applied } = makeRepo("RECEIVED_ORIGIN");
  const advance = createAdvancePackage({ repo });
  await assert.rejects(advance({ packageId: "pkg1", to: "DELIVERED", actorUserId: "u1" }), /ILLEGAL_PACKAGE_TRANSITION/);
  assert.equal(applied.length, 0);
});

test("pasar a AVAILABLE sin sucursal destino → lanza", async () => {
  const { repo } = makeRepo("IN_CUSTOMS");
  const advance = createAdvancePackage({ repo });
  await assert.rejects(advance({ packageId: "pkg1", to: "AVAILABLE", actorUserId: "u1" }), /DESTINATION_BRANCH_REQUIRED/);
});

test("pasar a AVAILABLE con sucursal → aplica y setea currentBranch", async () => {
  const { repo, applied } = makeRepo("IN_CUSTOMS");
  const advance = createAdvancePackage({ repo });
  await advance({ packageId: "pkg1", to: "AVAILABLE", actorUserId: "u1", destinationBranchId: "mga" });
  assert.equal((applied[0] as { setCurrentBranchId: string }).setCurrentBranchId, "mga");
  assert.equal((applied[0] as { markAvailableNow: boolean }).markAvailableNow, true);
});

test("paquete sin dueño no avanza más allá de RECEIVED_ORIGIN", async () => {
  const { repo } = makeRepo("CONSOLIDATED", null);
  const advance = createAdvancePackage({ repo });
  await assert.rejects(advance({ packageId: "pkg1", to: "IN_TRANSIT", actorUserId: "u1" }), /PACKAGE_HAS_NO_OWNER/);
});
