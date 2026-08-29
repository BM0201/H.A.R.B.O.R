/**
 * PASO R.4 — Confirmación de recepción del efectivo en tránsito.
 *
 * Cierra el hueco #1 de `docs/PENDIENTES.md`: `sendCashOutToCustody` deja el
 * dinero a nombre de alguien (entrada `HANDOVER` a su cuenta `CUSTODY`) pero no
 * existía el otro lado — el "recibí C$X de fulano" que transfiere la custodia.
 *
 * Decisión de diseño (respeta lo que ya decidió `cash-monitor.ts`): **sin
 * modelo nuevo, sin enum de estado**. El saldo de la cuenta `CUSTODY` ya dice
 * "en tránsito"; agregar un campo de estado sería el segundo lugar donde ese
 * hecho se desincroniza. La confirmación es una transferencia interna
 * (`HANDOVER_CONFIRMED`), igual que `DEPOSIT_DISPATCH → DEPOSIT_CONFIRMED`.
 *
 * Este archivo contiene solo las partes PURAS y testeables; el cuerpo
 * transaccional (`confirmCustodyReceipt`) vive en `service.ts` junto a
 * `confirmBankDeposit`, cuyo patrón espeja.
 */

export type CustodyReceiptOutcome = "MATCH" | "DISPUTED";

/**
 * ¿El monto que confirma el receptor coincide con el que se declaró al
 * entregar? Si no, es `DISPUTED`: no se cierra en silencio — abre un
 * `ApprovalRequest` y el saldo queda sin cuadrar hasta que se resuelva.
 */
export function custodyReceiptOutcome(input: {
  expectedAmount: number;
  confirmedAmount: number;
  tolerance?: number;
}): CustodyReceiptOutcome {
  const tolerance = input.tolerance ?? 0.01;
  return Math.abs(input.confirmedAmount - input.expectedAmount) > tolerance ? "DISPUTED" : "MATCH";
}

type CustodyEntryRow = {
  entryType: string;
  /** monto SIEMPRE positivo — el signo lo da la dirección/tipo */
  amount: number;
  /** true solo en HANDOVER dirigidos a una persona (no a un banco) */
  hasIntendedRecipient: boolean;
};

/**
 * Neto de entregas en persona sin confirmar sobre una cuenta `CUSTODY`:
 * `Σ HANDOVER(a persona)` menos `Σ HANDOVER_CONFIRMED`. Un valor > 0 significa
 * que el portador todavía tiene efectivo entregado a mano que nadie confirmó
 * haber recibido — no puede cerrar su jornada (PASO R.4.2).
 *
 * Los `DEPOSIT_DISPATCH` (rumbo a un banco) NO cuentan: esos los confirma
 * `confirmBankDeposit` a su tiempo y pueden quedar abiertos al cierre, igual
 * que en la ferretería.
 */
export function netUnconfirmedPersonHandoff(entries: readonly CustodyEntryRow[]): number {
  let net = 0;
  for (const e of entries) {
    if (e.entryType === "HANDOVER" && e.hasIntendedRecipient) net += e.amount;
    else if (e.entryType === "HANDOVER_CONFIRMED") net -= e.amount;
  }
  return Math.round(net * 100) / 100;
}
