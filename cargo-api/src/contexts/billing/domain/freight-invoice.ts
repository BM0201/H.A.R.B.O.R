/**
 * HARBOR PASO U.3 — Factura de FLETE (no de mercadería). Función pura.
 *
 * El desglose se arma desde el SNAPSHOT de cotización (`PackageQuote`), nunca
 * desde la tarifa vigente: reimprimir una factura de hoy debe seguir diciendo
 * lo mismo aunque el dueño cambie $6 a $7 mañana.
 *
 *   Flete    chargeableLb × pricePerLb
 *   Almacenaje  (días sobre el mínimo × tarifa/día)   — hoy 0
 *   Cargo categoría                                    — hoy 0
 *   ─────────────────────────────
 *   Total    suma de las líneas
 */

export type FreightQuoteSnapshot = {
  packageId: string;
  trackingCode: string;
  mode: "AIR" | "SEA";
  pricePerLb: number;
  chargeableLb: number;
  freightSubtotal: number;
  storageAmount: number;
  categoryAmount: number;
  currency: string;
};

export type InvoiceLine = {
  packageId: string;
  trackingCode: string;
  label: string;
  freightAmount: number;
  storageAmount: number;
  categoryAmount: number;
  lineTotal: number;
};

export type FreightInvoice = {
  currency: string;
  lines: InvoiceLine[];
  freightTotal: number;
  storageTotal: number;
  categoryTotal: number;
  grandTotal: number;
};

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function buildFreightInvoice(snapshots: readonly FreightQuoteSnapshot[]): FreightInvoice {
  if (snapshots.length === 0) throw new Error("EMPTY_INVOICE: no hay paquetes para facturar");

  const currencies = new Set(snapshots.map((s) => s.currency));
  if (currencies.size > 1) throw new Error("MIXED_CURRENCY: no se puede facturar paquetes en monedas distintas");
  const currency = snapshots[0].currency;

  const lines: InvoiceLine[] = snapshots.map((s) => {
    const freightAmount = round2(s.freightSubtotal);
    const storageAmount = round2(s.storageAmount);
    const categoryAmount = round2(s.categoryAmount);
    return {
      packageId: s.packageId,
      trackingCode: s.trackingCode,
      label: `Flete ${s.mode === "SEA" ? "marítimo" : "aéreo"} ${s.chargeableLb.toFixed(1)} lb × ${s.pricePerLb.toFixed(2)}/lb`,
      freightAmount,
      storageAmount,
      categoryAmount,
      lineTotal: round2(freightAmount + storageAmount + categoryAmount),
    };
  });

  const freightTotal = round2(lines.reduce((a, l) => a + l.freightAmount, 0));
  const storageTotal = round2(lines.reduce((a, l) => a + l.storageAmount, 0));
  const categoryTotal = round2(lines.reduce((a, l) => a + l.categoryAmount, 0));

  return {
    currency,
    lines,
    freightTotal,
    storageTotal,
    categoryTotal,
    grandTotal: round2(freightTotal + storageTotal + categoryTotal),
  };
}
