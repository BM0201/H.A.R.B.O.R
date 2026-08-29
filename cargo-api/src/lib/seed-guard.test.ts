import assert from "node:assert/strict";
import test from "node:test";
import { assertSeedTarget, SeedGuardError } from "@/lib/seed-guard";

const LOCAL = "postgresql://postgres@127.0.0.1:5433/harbor_dev?schema=public";
const NEON = "postgresql://user:pw@ep-cool-name-123.us-east-2.aws.neon.tech/harbor?sslmode=require";

test("seed-guard: acepta la DSN local anclada", () => {
  assert.doesNotThrow(() => assertSeedTarget({ DATABASE_URL: LOCAL }));
  assert.doesNotThrow(() =>
    assertSeedTarget({ DATABASE_URL: "postgres://postgres@localhost:5433/harbor_dev" }),
  );
});

test("seed-guard: rechaza una DSN de Neon sin ALLOW_REMOTE_SEED", () => {
  assert.throws(() => assertSeedTarget({ DATABASE_URL: NEON }), SeedGuardError);
});

test("seed-guard: substring no alcanza — host que solo CONTIENE 'localhost' se rechaza", () => {
  assert.throws(
    () => assertSeedTarget({ DATABASE_URL: "postgres://u:p@db.staging.localhost.corp.com:5432/harbor_dev" }),
    SeedGuardError,
  );
  assert.throws(
    () => assertSeedTarget({ DATABASE_URL: "postgres://u:p@ep-x.aws.neon.tech/app.local" }),
    SeedGuardError,
  );
});

test("seed-guard: ALLOW_REMOTE_SEED=true permite una base remota a propósito", () => {
  assert.doesNotThrow(() => assertSeedTarget({ DATABASE_URL: NEON, ALLOW_REMOTE_SEED: "true" }));
});

test("seed-guard: NODE_ENV=production aborta incluso con ALLOW_REMOTE_SEED=true", () => {
  assert.throws(
    () => assertSeedTarget({ DATABASE_URL: LOCAL, NODE_ENV: "production", ALLOW_REMOTE_SEED: "true" }),
    SeedGuardError,
  );
});

test("seed-guard: el mensaje de error nunca incluye la DATABASE_URL", () => {
  try {
    assertSeedTarget({ DATABASE_URL: NEON });
    assert.fail("debió lanzar");
  } catch (e) {
    assert.ok(e instanceof SeedGuardError);
    assert.ok(!e.message.includes("neon.tech"), "el mensaje filtró la URL");
    assert.ok(!e.message.includes("pw"), "el mensaje filtró credenciales");
  }
});
