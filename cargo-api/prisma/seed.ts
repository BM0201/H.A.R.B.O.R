/**
 * seed.ts — Seed de desarrollo / local para CARGO (courier).
 *
 * Idempotente: se puede correr varias veces sin duplicar datos.
 *
 * Crea:
 *   1. Agencia ORIGEN "Miami Hub" (MIA) — bodega en el exterior.
 *   2. Agencia DESTINO "Managua Central" (MGA) — recepción, aduana y entrega.
 *   3. Cajas físicas y BranchModuleConfig por agencia.
 *   4. Usuario MASTER + un usuario demo por cada rol de sucursal (CARGO-FASE-0A §C.3).
 *   5. BranchRoleConfig sembrado con los 5 roles de sucursal por agencia.
 *   6. Un CustomerUser demo (auth del cliente externo, separada del staff).
 *
 * Run:  npm run seed
 */

import { PrismaClient, RoleCode } from "@prisma/client";
import { hashPassword } from "../src/modules/auth/password";
import { assertSeedTarget, SeedGuardError } from "../src/lib/seed-guard";

const prisma = new PrismaClient();

const MASTER_USERNAME = process.env.MASTER_INITIAL_USERNAME ?? "master";
const MASTER_PASSWORD = process.env.MASTER_INITIAL_PASSWORD ?? "Dev@Seed#2024!LocalOnly";
const MASTER_EMAIL = "master@cargo.local";
const MASTER_FULLNAME = "System Master";

const ORIGIN_CODE = "MIA";
const ORIGIN_NAME = "Miami Hub (origen)";
const DEST_CODE = "MGA";
const DEST_NAME = "Managua Central (destino)";

const DEMO_PASSWORD = process.env.DEMO_USERS_PASSWORD ?? "Cargo1234!";

const BRANCH_ROLES: RoleCode[] = [
  RoleCode.BRANCH_ADMIN,
  RoleCode.COUNTER,
  RoleCode.CASHIER,
  RoleCode.WAREHOUSE_ORIGIN,
  RoleCode.WAREHOUSE_DESTINATION,
  RoleCode.COURIER,
];

async function seedBranchRoleConfig(branchId: string, actorUserId: string) {
  for (const role of BRANCH_ROLES) {
    await prisma.branchRoleConfig.upsert({
      where: { branchId_role: { branchId, role } },
      update: { enabled: true },
      create: { branchId, role, enabled: true, updatedByUserId: actorUserId },
    });
  }
}

async function main(): Promise<void> {
  assertSeedTarget();
  console.log("🔧 Seed CARGO (development) — starting …");

  // ── 1. Agencia origen ──────────────────────────────────────────────────────
  const origin = await prisma.branch.upsert({
    where: { code: ORIGIN_CODE },
    update: { name: ORIGIN_NAME, isActive: true },
    create: { code: ORIGIN_CODE, name: ORIGIN_NAME, isActive: true },
  });
  await prisma.physicalCashBox.upsert({
    where: { branchId_code: { branchId: origin.id, code: `CASH-${ORIGIN_CODE}-01` } },
    update: { isActive: true, description: "Caja origen" },
    create: { branchId: origin.id, code: `CASH-${ORIGIN_CODE}-01`, description: "Caja origen", isActive: true },
  });
  console.log(`  ✔ Agencia "${origin.name}" (${origin.code})`);

  // ── 2. Master user ─────────────────────────────────────────────────────────
  const masterUser = await prisma.user.upsert({
    where: { username: MASTER_USERNAME },
    update: {
      fullName: MASTER_FULLNAME,
      email: MASTER_EMAIL,
      globalRole: RoleCode.MASTER,
      isActive: true,
      ...(process.env.RESET_MASTER_PASSWORD === "true"
        ? { passwordHash: hashPassword(MASTER_PASSWORD), mustChangePassword: true }
        : {}),
    },
    create: {
      username: MASTER_USERNAME,
      fullName: MASTER_FULLNAME,
      email: MASTER_EMAIL,
      globalRole: RoleCode.MASTER,
      passwordHash: hashPassword(MASTER_PASSWORD),
      mustChangePassword: true,
      isActive: true,
    },
  });
  console.log(`  ✔ Master user "${masterUser.username}"`);

  // ── 3. Agencia destino + BranchModuleConfig + caja ─────────────────────────
  const dest = await prisma.branch.upsert({
    where: { code: DEST_CODE },
    update: { name: DEST_NAME, isActive: true },
    create: { code: DEST_CODE, name: DEST_NAME, isActive: true },
  });
  await prisma.branchModuleConfig.upsert({
    where: { branchId: dest.id },
    update: {
      enableCashier: true,
      enableDispatch: true,
      enableCustoms: true,
      enableHomeDelivery: true,
      enableStorageFees: true,
      updatedByUserId: masterUser.id,
    },
    create: {
      branchId: dest.id,
      enableCashier: true,
      enableDispatch: true,
      enableCustoms: true,
      enableHomeDelivery: true,
      enableStorageFees: true,
      updatedByUserId: masterUser.id,
    },
  });
  await prisma.branchModuleConfig.upsert({
    where: { branchId: origin.id },
    update: { enableOriginWarehouse: true, updatedByUserId: masterUser.id },
    create: { branchId: origin.id, enableOriginWarehouse: true, updatedByUserId: masterUser.id },
  });
  const destCashBox = await prisma.physicalCashBox.upsert({
    where: { branchId_code: { branchId: dest.id, code: `CASH-${DEST_CODE}-01` } },
    update: { isActive: true, description: "Caja destino" },
    create: { branchId: dest.id, code: `CASH-${DEST_CODE}-01`, description: "Caja destino", isActive: true },
  });
  console.log(`  ✔ Agencia "${dest.name}" (${dest.code}) — caja ${destCashBox.code}`);

  await seedBranchRoleConfig(origin.id, masterUser.id);
  await seedBranchRoleConfig(dest.id, masterUser.id);
  console.log("  ✔ BranchRoleConfig sembrado en ambas agencias");

  // ── 4. Un usuario demo por rol de sucursal ─────────────────────────────────
  const demoHash = hashPassword(DEMO_PASSWORD);
  const demoUsers: Array<{ username: string; fullName: string; email: string; branchId: string; roles: RoleCode[] }> = [
    { username: "mostrador", fullName: "Mostrador Demo", email: "mostrador@cargo.local", branchId: dest.id, roles: [RoleCode.COUNTER] },
    { username: "cajero", fullName: "Cajero Demo", email: "cajero@cargo.local", branchId: dest.id, roles: [RoleCode.CASHIER] },
    { username: "bodega-origen", fullName: "Bodega Origen Demo", email: "bodega.origen@cargo.local", branchId: origin.id, roles: [RoleCode.WAREHOUSE_ORIGIN] },
    { username: "bodega-destino", fullName: "Bodega Destino Demo", email: "bodega.destino@cargo.local", branchId: dest.id, roles: [RoleCode.WAREHOUSE_DESTINATION] },
    { username: "repartidor", fullName: "Repartidor Demo", email: "repartidor@cargo.local", branchId: dest.id, roles: [RoleCode.COURIER] },
    { username: "admin-agencia", fullName: "Admin de Agencia Demo", email: "admin.agencia@cargo.local", branchId: dest.id, roles: [RoleCode.BRANCH_ADMIN] },
  ];
  for (const du of demoUsers) {
    const user = await prisma.user.upsert({
      where: { username: du.username },
      update: { fullName: du.fullName, email: du.email, isActive: true, globalRole: null },
      create: {
        username: du.username,
        fullName: du.fullName,
        email: du.email,
        globalRole: null,
        passwordHash: demoHash,
        mustChangePassword: false,
        isActive: true,
      },
    });
    for (const roleCode of du.roles) {
      await prisma.userBranchRole.upsert({
        where: { userId_branchId_roleCode: { userId: user.id, branchId: du.branchId, roleCode } },
        update: { isActive: true },
        create: { userId: user.id, branchId: du.branchId, roleCode },
      });
    }
    console.log(`  ✔ User "${user.username}" -> [${du.roles.join(", ")}]`);
  }

  // Contador (rol global de solo-contabilidad).
  await prisma.user.upsert({
    where: { username: "contador" },
    update: { fullName: "Contador Demo", email: "contador@cargo.local", isActive: true, globalRole: RoleCode.ACCOUNTANT },
    create: {
      username: "contador",
      fullName: "Contador Demo",
      email: "contador@cargo.local",
      globalRole: RoleCode.ACCOUNTANT,
      passwordHash: demoHash,
      mustChangePassword: false,
      isActive: true,
    },
  });
  console.log(`  ✔ User "contador" -> [ACCOUNTANT global]`);

  // ── 5. Cliente demo + su auth de portal (separada del staff) ───────────────
  const customer = await prisma.customer.upsert({
    where: { code: "NIC-00001" },
    update: { displayName: "Cliente Demo", legalName: "Cliente Demo", isActive: true },
    create: {
      code: "NIC-00001",
      legalName: "Cliente Demo",
      displayName: "Cliente Demo",
      email: "cliente@example.com",
      isActive: true,
    },
  });
  await prisma.customerBranchScope.upsert({
    where: { customerId_branchId: { customerId: customer.id, branchId: dest.id } },
    update: { isAllowed: true },
    create: { customerId: customer.id, branchId: dest.id, isAllowed: true },
  });
  await prisma.customerUser.upsert({
    where: { customerId: customer.id },
    update: { email: "cliente@example.com", isActive: true },
    create: {
      customerId: customer.id,
      email: "cliente@example.com",
      passwordHash: demoHash,
      isActive: true,
    },
  });
  console.log(`  ✔ Customer "${customer.code}" + CustomerUser demo`);

  // ── 6. Tarifario general (HARBOR PASO S.3) ─────────────────────────────────
  // $6.00/lb aérea · $2.50/lb marítima. volumetricDivisor null → D-1 apagado
  // (se decide con el dueño). effectiveFrom en el pasado para que resuelva ya.
  const rateFrom = new Date("2026-01-01T00:00:00Z");
  for (const [name, mode, price] of [
    ["General aérea", "AIR", 6.0],
    ["General marítima", "SEA", 2.5],
  ] as const) {
    const existing = await prisma.rateCard.findFirst({ where: { name, mode, customerId: null } });
    if (!existing) {
      await prisma.rateCard.create({
        data: {
          name,
          mode,
          pricePerLb: price,
          minimumCharge: mode === "AIR" ? 5 : 0,
          volumetricDivisor: null,
          currency: "USD",
          effectiveFrom: rateFrom,
          createdByUserId: masterUser.id,
        },
      });
    }
  }
  console.log("  ✔ RateCard general (AIR $6.00 · SEA $2.50)");

  // ── 7. Pre-alertas demo para el cliente NIC-00001 (HARBOR PASO S.2) ────────
  // Una aérea con tracking UPS, una marítima con tracking USPS. Sirven para
  // probar el match en desarrollo (`/app/warehouse/receiving`).
  for (const [carrier, tracking, mode, desc] of [
    ["UPS", "1Z999AA10123456784", "AIR", "Auriculares (Amazon)"],
    ["USPS", "9405503699300012345671", "SEA", "Repuestos varios (eBay)"],
  ] as const) {
    await prisma.preAlert.upsert({
      where: { customerId_originTrackingNumber: { customerId: customer.id, originTrackingNumber: tracking } },
      update: { mode, description: desc },
      create: {
        customerId: customer.id,
        mode,
        originCarrier: carrier,
        originTrackingNumber: tracking,
        description: desc,
        declaredValue: mode === "AIR" ? 45 : 120,
      },
    });
  }
  console.log("  ✔ Pre-alertas demo (1 aérea UPS · 1 marítima USPS)");

  await prisma.auditLog.create({
    data: {
      actorUserId: masterUser.id,
      branchId: dest.id,
      module: "seed",
      action: "SEED_COMPLETE_CARGO",
      entityType: "User",
      entityId: masterUser.id,
      metadataJson: { branches: [ORIGIN_CODE, DEST_CODE], environment: "development" },
    },
  });

  console.log("✅ Seed CARGO completado.");
  console.log("   ──────────────────────────────────────────────");
  console.log(`   Master:        ${MASTER_USERNAME} / ${MASTER_PASSWORD}`);
  console.log(`   Demo staff:    mostrador, cajero, bodega-origen, bodega-destino, repartidor, admin-agencia, contador`);
  console.log(`   Demo password: ${DEMO_PASSWORD}`);
  console.log(`   Cliente demo:  NIC-00001 (portal: cliente@example.com / ${DEMO_PASSWORD})`);
  console.log("   ──────────────────────────────────────────────");
}

main()
  .catch((error) => {
    if (error instanceof SeedGuardError) {
      console.error(error.message);
    } else {
      console.error("❌ Seed failed:", error);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
