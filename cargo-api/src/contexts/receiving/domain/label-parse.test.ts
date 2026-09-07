import assert from "node:assert/strict";
import test from "node:test";
import { parseLabelRecipient, rankCandidates, foldName } from "@/contexts/receiving/domain/label-parse";

// HARBOR PASO S.2 — lectura de la etiqueta: SÓLO pre-llena, nunca asigna.

test("prefijo Air/Mar → modalidad sugerida + nombre sin prefijo", () => {
  const air = parseLabelRecipient("AirBmCargo Juan Perez");
  assert.equal(air.suggestedMode, "AIR");
  assert.equal(air.recipientName, "Juan Perez");

  const sea = parseLabelRecipient("MarBmCargo  Maria  Rodriguez Lopez");
  assert.equal(sea.suggestedMode, "SEA");
  assert.deepEqual(sea.nameTokens, ["maria", "rodriguez", "lopez"]);
});

test("sin prefijo reconocible → modalidad null, nombre completo", () => {
  const r = parseLabelRecipient("Pedro Martinez");
  assert.equal(r.suggestedMode, null);
  assert.equal(r.recipientName, "Pedro Martinez");
});

test("foldName quita tildes y ñ para comparación tolerante", () => {
  assert.equal(foldName("Bayardo Méndez-Ñato"), "bayardo mendez nato");
});

test("rankCandidates ordena por parecido y es estable por código — NO decide", () => {
  const parsed = parseLabelRecipient("AirBmCargo Juan Perez");
  const ranked = rankCandidates(parsed, [
    { id: "c1", code: "NIC-00003", displayName: "Otro Cliente", legalName: "Otro Cliente" },
    { id: "c2", code: "NIC-00001", displayName: "Juan Perez", legalName: "Juan Perez Gomez" },
    { id: "c3", code: "NIC-00002", displayName: "Juan Ramirez", legalName: "Juan Ramirez" },
  ]);
  assert.equal(ranked[0].id, "c2"); // ambos tokens
  assert.equal(ranked[1].id, "c3"); // un token
  assert.equal(ranked[2].id, "c1"); // ninguno
  assert.equal(ranked[0].score, 1);
});

test("etiqueta ilegible (sin tokens) → todos los candidatos con score 0", () => {
  const parsed = parseLabelRecipient("");
  const ranked = rankCandidates(parsed, [
    { id: "c1", code: "NIC-00001", displayName: "Juan", legalName: "Juan" },
  ]);
  assert.equal(ranked[0].score, 0);
});
