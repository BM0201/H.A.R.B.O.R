import assert from "node:assert/strict";
import test from "node:test";
import {
  computeVolumetricLb,
  computeChargeableLb,
  computeWeightVariance,
  isWeightVarianceFlagged,
} from "@/contexts/cargo/domain/measurement";

// HARBOR PASO S — D-1 (volumétrico) y D-2 (discrepancia de pesajes).

test("D-1: sin divisor (null) el volumétrico es 0 — comportamiento interino", () => {
  assert.equal(computeVolumetricLb({ lengthIn: 24, widthIn: 20, heightIn: 16 }, null), 0);
  assert.equal(computeVolumetricLb({ lengthIn: 24, widthIn: 20, heightIn: 16 }, 0), 0);
});

test("D-1: con divisor, volumétrico = L*W*H/divisor redondeado a 2", () => {
  assert.equal(computeVolumetricLb({ lengthIn: 24, widthIn: 20, heightIn: 16 }, 166), 46.27);
  assert.equal(computeVolumetricLb({ lengthIn: 10, widthIn: 10, heightIn: 10 }, 139), 7.19);
});

test("D-1: dimensiones incompletas o no positivas → 0", () => {
  assert.equal(computeVolumetricLb({ lengthIn: 24, widthIn: 20 }, 166), 0);
  assert.equal(computeVolumetricLb({ lengthIn: 0, widthIn: 20, heightIn: 16 }, 166), 0);
  assert.equal(computeVolumetricLb(null, 166), 0);
});

test("chargeable = max(real, volumétrico)", () => {
  assert.equal(computeChargeableLb(4, 0), 4); // real gana (D-1 apagado)
  assert.equal(computeChargeableLb(4, 46.27), 46.27); // volumétrico gana
  assert.equal(computeChargeableLb(10, 10), 10); // empate
});

test("D-2: varianza (customs - origin) / origin, 4 decimales; null si falta un dato", () => {
  assert.equal(computeWeightVariance(4.0, 4.8), 0.2);
  assert.equal(computeWeightVariance(10, 10.3), 0.03);
  assert.equal(computeWeightVariance(4.0, null), null);
  assert.equal(computeWeightVariance(0, 5), null); // no se puede dividir
});

test("D-2: se marca el paquete si |varianza| > 5%", () => {
  assert.equal(isWeightVarianceFlagged(0.03), false);
  assert.equal(isWeightVarianceFlagged(0.05), false); // en el umbral no marca
  assert.equal(isWeightVarianceFlagged(0.2), true);
  assert.equal(isWeightVarianceFlagged(-0.08), true); // aduana pesó MENOS también cuenta
  assert.equal(isWeightVarianceFlagged(null), false);
});
