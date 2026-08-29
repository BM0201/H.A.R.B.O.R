import assert from "node:assert/strict";
import test from "node:test";
import { custodyReceiptOutcome, netUnconfirmedPersonHandoff } from "@/modules/treasury/custody";

// PASO R.4 — partes puras de la confirmación de custodia.

test("custodyReceiptOutcome: montos iguales → MATCH", () => {
  assert.equal(custodyReceiptOutcome({ expectedAmount: 500, confirmedAmount: 500 }), "MATCH");
  assert.equal(custodyReceiptOutcome({ expectedAmount: 500, confirmedAmount: 500.009 }), "MATCH");
});

test("custodyReceiptOutcome: monto distinto → DISPUTED (no se cierra en silencio)", () => {
  assert.equal(custodyReceiptOutcome({ expectedAmount: 500, confirmedAmount: 480 }), "DISPUTED");
  assert.equal(custodyReceiptOutcome({ expectedAmount: 500, confirmedAmount: 520 }), "DISPUTED");
});

test("netUnconfirmedPersonHandoff: HANDOVER a persona sin confirmar cuenta; a banco no", () => {
  const entries = [
    { entryType: "HANDOVER", amount: 500, hasIntendedRecipient: true },   // a persona
    { entryType: "HANDOVER", amount: 900, hasIntendedRecipient: false },  // a banco (DEPOSIT_DISPATCH real usa otro tipo; esto es defensivo)
  ];
  assert.equal(netUnconfirmedPersonHandoff(entries), 500);
});

test("netUnconfirmedPersonHandoff: una vez confirmado, el neto vuelve a 0", () => {
  const entries = [
    { entryType: "HANDOVER", amount: 500, hasIntendedRecipient: true },
    { entryType: "HANDOVER_CONFIRMED", amount: 500, hasIntendedRecipient: false },
  ];
  assert.equal(netUnconfirmedPersonHandoff(entries), 0);
});

test("netUnconfirmedPersonHandoff: confirmación parcial (disputa resuelta a menos) deja el resto pendiente", () => {
  const entries = [
    { entryType: "HANDOVER", amount: 500, hasIntendedRecipient: true },
    { entryType: "HANDOVER_CONFIRMED", amount: 480, hasIntendedRecipient: false },
  ];
  assert.equal(netUnconfirmedPersonHandoff(entries), 20);
});

test("netUnconfirmedPersonHandoff: sin entradas → 0", () => {
  assert.equal(netUnconfirmedPersonHandoff([]), 0);
});
