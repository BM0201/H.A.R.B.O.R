import assert from "node:assert/strict";
import test from "node:test";
import {
  generateTrackingCode,
  isWellFormedTrackingCode,
  TRACKING_ALPHABET,
  TRACKING_CODE_LENGTH,
} from "@/contexts/cargo/domain/tracking-code";

// HARBOR PASO S.1 / PASO 8 E.1 — trackingCode público NO enumerable.

test("longitud por defecto y alfabeto sin caracteres ambiguos (0/O/1/I/L/U)", () => {
  assert.equal(TRACKING_ALPHABET.includes("0"), false);
  assert.equal(TRACKING_ALPHABET.includes("1"), false);
  assert.equal(TRACKING_ALPHABET.includes("I"), false);
  assert.equal(TRACKING_ALPHABET.includes("L"), false);
  assert.equal(TRACKING_ALPHABET.includes("O"), false);
  assert.equal(TRACKING_ALPHABET.includes("U"), false);

  for (let i = 0; i < 200; i++) {
    const code = generateTrackingCode();
    assert.equal(code.length, TRACKING_CODE_LENGTH);
    assert.match(code, new RegExp(`^[${TRACKING_ALPHABET}]+$`));
  }
});

test("no es secuencial ni derivable — 5000 códigos sin colisión y sin orden", () => {
  const seen = new Set<string>();
  let ascending = 0;
  let prev = "";
  for (let i = 0; i < 5000; i++) {
    const code = generateTrackingCode();
    assert.equal(seen.has(code), false, "colisión en 5000 códigos — entropía insuficiente");
    seen.add(code);
    if (prev && code > prev) ascending += 1;
    prev = code;
  }
  // Si fuera un correlativo, ascending sería ~5000. Aleatorio ≈ 50%.
  assert.ok(ascending > 1500 && ascending < 3500, `patrón sospechoso de secuencia: ${ascending}/4999`);
});

test("isWellFormedTrackingCode: forma, no existencia", () => {
  assert.equal(isWellFormedTrackingCode("WASRXA"), true);
  assert.equal(isWellFormedTrackingCode("ABC"), false); // corto
  assert.equal(isWellFormedTrackingCode("ABC0DE"), false); // 0 prohibido
  assert.equal(isWellFormedTrackingCode("abcdef"), false); // minúsculas
  assert.equal(isWellFormedTrackingCode("WASRXA7K"), true); // 8, ≥6 ok
});
