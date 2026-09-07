import assert from "node:assert/strict";
import test from "node:test";
import { computeQuote } from "@/contexts/rating/domain/quote";

// HARBOR PASO S.3 — tabla de cotización. Función pura.
//   volumetricLb = divisor ? (L*W*H)/divisor : 0
//   chargeableLb = max(weightOriginLb, volumetricLb)
//   subtotal     = max(chargeableLb * pricePerLb, minimumCharge)

const rate = (o: Partial<Parameters<typeof computeQuote>[0]["rate"]> = {}) => ({
  id: "r1",
  pricePerLb: 6,
  minimumCharge: 0,
  volumetricDivisor: null as number | null,
  currency: "USD",
  ...o,
});

const cases: Array<{
  name: string;
  weight: number;
  dims: { lengthIn: number; widthIn: number; heightIn: number } | null;
  rate: ReturnType<typeof rate>;
  expect: { volumetricLb: number; chargeableLb: number; subtotal: number };
}> = [
  { name: "peso real gana (D-1 apagado): 4 lb aéreo", weight: 4, dims: null, rate: rate({ pricePerLb: 6 }), expect: { volumetricLb: 0, chargeableLb: 4, subtotal: 24 } },
  { name: "marítimo 10 lb a 2.50", weight: 10, dims: null, rate: rate({ pricePerLb: 2.5 }), expect: { volumetricLb: 0, chargeableLb: 10, subtotal: 25 } },
  { name: "peso real exacto multiplica", weight: 3.5, dims: null, rate: rate({ pricePerLb: 6 }), expect: { volumetricLb: 0, chargeableLb: 3.5, subtotal: 21 } },
  { name: "bajo el mínimo → cobra el mínimo", weight: 0.5, dims: null, rate: rate({ pricePerLb: 6, minimumCharge: 8 }), expect: { volumetricLb: 0, chargeableLb: 0.5, subtotal: 8 } },
  { name: "sobre el mínimo → cobra por peso", weight: 5, dims: null, rate: rate({ pricePerLb: 6, minimumCharge: 8 }), expect: { volumetricLb: 0, chargeableLb: 5, subtotal: 30 } },
  { name: "divisor null → volumétrico ignorado aunque haya dims", weight: 4, dims: { lengthIn: 24, widthIn: 20, heightIn: 16 }, rate: rate({ pricePerLb: 6 }), expect: { volumetricLb: 0, chargeableLb: 4, subtotal: 24 } },
  { name: "volumétrico gana: caja grande y liviana", weight: 4, dims: { lengthIn: 24, widthIn: 20, heightIn: 16 }, rate: rate({ pricePerLb: 6, volumetricDivisor: 166 }), expect: { volumetricLb: 46.27, chargeableLb: 46.27, subtotal: 277.62 } },
  { name: "peso real gana pese al volumétrico", weight: 60, dims: { lengthIn: 24, widthIn: 20, heightIn: 16 }, rate: rate({ pricePerLb: 6, volumetricDivisor: 166 }), expect: { volumetricLb: 46.27, chargeableLb: 60, subtotal: 360 } },
  { name: "empate real/volumétrico", weight: 7.19, dims: { lengthIn: 10, widthIn: 10, heightIn: 10 }, rate: rate({ pricePerLb: 6, volumetricDivisor: 139 }), expect: { volumetricLb: 7.19, chargeableLb: 7.19, subtotal: 43.14 } },
  { name: "tarifa especial más barata", weight: 10, dims: null, rate: rate({ pricePerLb: 4.5 }), expect: { volumetricLb: 0, chargeableLb: 10, subtotal: 45 } },
  { name: "moneda NIO se propaga", weight: 2, dims: null, rate: rate({ pricePerLb: 200, currency: "NIO" }), expect: { volumetricLb: 0, chargeableLb: 2, subtotal: 400 } },
  { name: "redondeo a 2 decimales", weight: 1.333, dims: null, rate: rate({ pricePerLb: 6 }), expect: { volumetricLb: 0, chargeableLb: 1.33, subtotal: 7.98 } },
];

for (const c of cases) {
  test(`cotización: ${c.name}`, () => {
    const q = computeQuote({ weightOriginLb: c.weight, dimensions: c.dims, rate: c.rate });
    assert.equal(q.volumetricLb, c.expect.volumetricLb, "volumetricLb");
    assert.equal(q.chargeableLb, c.expect.chargeableLb, "chargeableLb");
    assert.equal(q.subtotal, c.expect.subtotal, "subtotal");
    assert.equal(q.currency, c.rate.currency);
  });
}

test("peso 0 o negativo → lanza (nunca cotizar sin peso)", () => {
  assert.throws(() => computeQuote({ weightOriginLb: 0, dimensions: null, rate: rate() }), /INVALID_WEIGHT/);
});
