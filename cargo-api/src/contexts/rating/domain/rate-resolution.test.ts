import assert from "node:assert/strict";
import test from "node:test";
import { resolveRate, NoApplicableRateError, type RateCardInput } from "@/contexts/rating/domain/rate-resolution";

// HARBOR PASO S.3 — resolución de tarifa: especial vigente → general vigente → error.

const AT = new Date("2026-09-07T12:00:00Z");
const card = (o: Partial<RateCardInput>): RateCardInput => ({
  id: "r",
  mode: "AIR",
  pricePerLb: 6,
  minimumCharge: 0,
  volumetricDivisor: null,
  currency: "USD",
  isActive: true,
  effectiveFrom: new Date("2026-01-01T00:00:00Z"),
  effectiveTo: null,
  customerId: null,
  ...o,
});

test("sin candidatas → NoApplicableRateError (nunca cobrar 0)", () => {
  assert.throws(() => resolveRate([], { mode: "AIR", customerId: null, at: AT }), NoApplicableRateError);
  assert.throws(
    () => resolveRate([card({ mode: "SEA" })], { mode: "AIR", customerId: null, at: AT }),
    NoApplicableRateError,
  );
});

test("tarifa general vigente cuando no hay especial", () => {
  const r = resolveRate([card({ id: "gen", pricePerLb: 6 })], { mode: "AIR", customerId: "c1", at: AT });
  assert.equal(r.id, "gen");
});

test("la especial del cliente gana sobre la general", () => {
  const r = resolveRate(
    [card({ id: "gen" }), card({ id: "esp", customerId: "c1", pricePerLb: 4.5 })],
    { mode: "AIR", customerId: "c1", at: AT },
  );
  assert.equal(r.id, "esp");
  assert.equal(r.pricePerLb, 4.5);
});

test("especial VENCIDA cae a la general", () => {
  const r = resolveRate(
    [
      card({ id: "gen" }),
      card({ id: "esp", customerId: "c1", effectiveTo: new Date("2026-06-01T00:00:00Z") }),
    ],
    { mode: "AIR", customerId: "c1", at: AT },
  );
  assert.equal(r.id, "gen");
});

test("especial de OTRO cliente no aplica", () => {
  const r = resolveRate(
    [card({ id: "gen" }), card({ id: "esp", customerId: "otro" })],
    { mode: "AIR", customerId: "c1", at: AT },
  );
  assert.equal(r.id, "gen");
});

test("inactiva no cuenta; entre dos vigentes gana la de effectiveFrom más reciente", () => {
  const r = resolveRate(
    [
      card({ id: "vieja", effectiveFrom: new Date("2026-01-01T00:00:00Z") }),
      card({ id: "nueva", effectiveFrom: new Date("2026-08-01T00:00:00Z") }),
      card({ id: "off", isActive: false, effectiveFrom: new Date("2026-09-01T00:00:00Z") }),
    ],
    { mode: "AIR", customerId: null, at: AT },
  );
  assert.equal(r.id, "nueva");
});

test("tarifa futura todavía no vigente no aplica", () => {
  assert.throws(
    () =>
      resolveRate([card({ effectiveFrom: new Date("2026-12-01T00:00:00Z") })], {
        mode: "AIR",
        customerId: null,
        at: AT,
      }),
    NoApplicableRateError,
  );
});
