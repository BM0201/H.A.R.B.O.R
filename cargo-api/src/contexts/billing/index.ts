/**
 * Contexto `billing` — API pública. Factura de FLETE leída del snapshot de
 * cotización (PASO U.3). La línea de factura apunta a paquetes, no a productos.
 */
export {
  buildFreightInvoice,
  type FreightInvoice,
  type FreightQuoteSnapshot,
  type InvoiceLine,
} from "@/contexts/billing/domain/freight-invoice";

export {
  billFreightForPickup,
  collectFreightPayment,
  getFreightInvoice,
} from "@/contexts/billing/infrastructure/billing-service";
