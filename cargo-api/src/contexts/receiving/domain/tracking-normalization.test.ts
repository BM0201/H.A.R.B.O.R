import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCarrierTracking, canonicalTracking } from "@/contexts/receiving/domain/tracking-normalization";

// HARBOR PASO S.2 — normalización del tracking del carrier. Función pura.

test("USPS IMpb: extrae los 22 dígitos del tracking, con y sin prefijo 420+ZIP", () => {
  const plain = normalizeCarrierTracking("9400 1000 0000 0000 0000 00");
  assert.equal(plain.carrier, "USPS");
  assert.equal(plain.normalized, "9400100000000000000000");

  // 420 + ZIP5(92101) + 9405...(22)
  const impb = normalizeCarrierTracking("420 92101 9405 5036 9930 0001 2345 67");
  assert.equal(impb.carrier, "USPS");
  assert.equal(impb.normalized.length, 22);
  assert.equal(impb.normalized, "9405503699300001234567");

  // 420 + ZIP9(921010001) + 9205...(22)
  const impbZip9 = normalizeCarrierTracking("420921010001 9205 5036 9930 0001 2345 67");
  assert.equal(impbZip9.carrier, "USPS");
  assert.equal(impbZip9.normalized.length, 22);
  assert.equal(impbZip9.normalized.startsWith("92"), true);
});

test("UPS: patrón 1Z + 16, tolera espacios y minúsculas", () => {
  const r = normalizeCarrierTracking("1z 999 aa1 01 2345 6784");
  assert.equal(r.carrier, "UPS");
  assert.equal(r.normalized, "1Z999AA10123456784");
  assert.equal(r.normalized.length, 18);
});

test("FedEx: 12, 15 y 20 dígitos; y el barcode 96 de 34 dígitos", () => {
  assert.equal(normalizeCarrierTracking("9612 3456 7890").carrier, "FEDEX");
  assert.equal(normalizeCarrierTracking("9612 3456 7890").normalized, "961234567890");
  assert.equal(normalizeCarrierTracking("123456789012345").normalized, "123456789012345");
  assert.equal(normalizeCarrierTracking("12345678901234567890").normalized, "12345678901234567890");

  // barcode "96" de 34 dígitos → heurística: los últimos 12 son el tracking
  const b96 = normalizeCarrierTracking("9611020987654312345678901234567890");
  assert.equal(b96.carrier, "FEDEX");
  assert.equal(b96.normalized.length, 12);
  assert.equal(b96.normalized, "901234567890");
});

test("Amazon Logistics: TBA + 12 dígitos", () => {
  const r = normalizeCarrierTracking("TBA123456789012");
  assert.equal(r.carrier, "AMAZON");
  assert.equal(r.normalized, "TBA123456789012");
});

test("desconocido: no lanza, normaliza a alfanumérico en mayúsculas (match exacto sigue posible)", () => {
  const r = normalizeCarrierTracking("  abc-123-xyz  ");
  assert.equal(r.carrier, "UNKNOWN");
  assert.equal(r.normalized, "ABC123XYZ");
  assert.equal(r.raw, "abc-123-xyz");
});

test("canonicalTracking: misma cadena cruda → misma forma canónica (idempotente para el match)", () => {
  assert.equal(canonicalTracking("1Z999AA10123456784"), canonicalTracking("1z 999 aa1 0123456784"));
});
