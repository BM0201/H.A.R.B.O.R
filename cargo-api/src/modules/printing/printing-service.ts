import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/modules/audit/service";
import { createPrintLog } from "@/modules/print/service";
import type { DocumentType, PrintSettings } from "@prisma/client";

type RenderFormat = "HTML" | "TEXT" | "JSON";

type PrintSettingsView = {
  id: string | null;
  branchId: string;
  cashRegisterId: string | null;
  name: string;
  printerType: "BROWSER" | "THERMAL_BROWSER" | "ESC_POS_FUTURE";
  paperSize: "THERMAL_58MM" | "THERMAL_80MM" | "A4";
  copiesTicket: number;
  copiesDeliveryOrder: number;
  autoPrintTicket: boolean;
  autoPrintDelivery: boolean;
  businessName: string | null;
  businessLegalName: string | null;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  footerMessage: string | null;
  logoUrl: string | null;
  showPricesOnDeliveryOrder: boolean;
  showCostData: boolean;
  showCashierName: boolean;
  showCustomerData: boolean;
  ticketTemplate: string | null;
  deliveryTemplate: string | null;
  receiptTemplate: string | null;
  isDefault: boolean;
  isActive: boolean;
  isVirtualDefault: boolean;
  legacy: {
    printerName: string | null;
    printerMode: string;
    paperWidth: string;
    fontSize: number;
    copies: number;
    autoPrint: boolean;
    cutPaper: boolean;
    openDrawer: boolean;
    showQr: boolean;
  };
};

type RecordPrintAuditInput = {
  actorUserId?: string;
  branchId?: string;
  documentType: string;
  entityType: string;
  entityId: string;
  saleOrderId?: string;
  isReprint?: boolean;
  reason?: string;
  metadataJson?: Record<string, unknown>;
};

function n(value: unknown, fallback = 0) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function money(value: unknown) {
  return `C$ ${n(value).toFixed(2)}`;
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleString("es-NI", { dateStyle: "short", timeStyle: "short" });
}

function mapPrinterType(settings?: PrintSettings | null): PrintSettingsView["printerType"] {
  if (settings?.printerMode === "NETWORK_ESCPOS") return "ESC_POS_FUTURE";
  if (settings?.printerMode === "QZ_TRAY") return "THERMAL_BROWSER";
  return "BROWSER";
}

function mapPaperSize(settings?: PrintSettings | null): PrintSettingsView["paperSize"] {
  if (settings?.paperWidth === "W58MM") return "THERMAL_58MM";
  if (settings?.paperWidth === "A4") return "A4";
  return "THERMAL_80MM";
}

function printableWidth(settings: PrintSettingsView) {
  if (settings.paperSize === "THERMAL_58MM") return "58mm";
  if (settings.paperSize === "A4") return "210mm";
  return "80mm";
}

function buildSettingsView(branch: { id: string; code?: string; name: string }, settings?: PrintSettings | null): PrintSettingsView {
  return {
    id: settings?.id ?? null,
    branchId: branch.id,
    cashRegisterId: settings?.cashRegisterId ?? null,
    name: settings?.name ?? "Configuracion principal",
    printerType: mapPrinterType(settings),
    paperSize: mapPaperSize(settings),
    copiesTicket: settings?.copies ?? 1,
    copiesDeliveryOrder: settings?.copiesDeliveryOrder ?? 1,
    autoPrintTicket: settings?.autoPrint ?? false,
    autoPrintDelivery: settings?.autoPrintDelivery ?? false,
    businessName: settings?.businessName ?? branch.name ?? "BM CARGO",
    businessLegalName: settings?.businessLegalName ?? null,
    taxId: settings?.taxId ?? null,
    address: settings?.address ?? null,
    phone: settings?.phone ?? null,
    footerMessage: settings?.footerText ?? null,
    logoUrl: settings?.logoUrl ?? null,
    showPricesOnDeliveryOrder: settings?.showPricesOnDeliveryOrder ?? false,
    showCostData: settings?.showCostData ?? false,
    showCashierName: settings?.showCashierName ?? true,
    showCustomerData: settings?.showCustomerData ?? true,
    ticketTemplate: settings?.ticketTemplate ?? null,
    deliveryTemplate: settings?.deliveryTemplate ?? null,
    receiptTemplate: settings?.receiptTemplate ?? null,
    isDefault: settings?.isDefault ?? true,
    isActive: settings?.isActive ?? true,
    isVirtualDefault: !settings,
    legacy: {
      printerName: settings?.printerName ?? null,
      printerMode: settings?.printerMode ?? "BROWSER_PRINT",
      paperWidth: settings?.paperWidth ?? "W80MM",
      fontSize: settings?.fontSize ?? 12,
      copies: settings?.copies ?? 1,
      autoPrint: settings?.autoPrint ?? false,
      cutPaper: settings?.cutPaper ?? true,
      openDrawer: settings?.openDrawer ?? false,
      showQr: settings?.showQr ?? false,
    },
  };
}

export async function getPrintSettings(input: { branchId: string; cashRegisterId?: string | null }) {
  const branch = await prisma.branch.findUniqueOrThrow({ where: { id: input.branchId }, select: { id: true, code: true, name: true } });
  const settings = await prisma.printSettings.findUnique({ where: { branchId: input.branchId } });
  return buildSettingsView(branch, settings);
}


// NOTA(cargo): los renderizadores de ticket/orden de entrega/transferencia/
// orden de compra se eliminaron con el motor de producto. La facturación
// de paquetes/embarques se implementa en una fase posterior.

export async function recordPrintAudit(input: RecordPrintAuditInput) {
  if (input.saleOrderId && ["DELIVERY_ORDER", "PURCHASE_TICKET", "PAYMENT_RECEIPT", "PRODUCTION_ORDER"].includes(input.documentType)) {
    await createPrintLog({
      saleOrderId: input.saleOrderId,
      documentType: input.documentType as DocumentType,
      printedById: input.actorUserId ?? "",
      isReprint: input.isReprint,
      reprintReason: input.reason,
    }).catch(() => undefined);
  }

  await logAuditEvent({
    actorUserId: input.actorUserId,
    branchId: input.branchId,
    module: "printing",
    action: input.isReprint ? "DOCUMENT_REPRINTED" : "DOCUMENT_PRINTED",
    entityType: input.entityType,
    entityId: input.entityId,
    metadataJson: {
      documentType: input.documentType,
      saleOrderId: input.saleOrderId,
      isReprint: input.isReprint ?? false,
      reason: input.reason,
      ...(input.metadataJson ?? {}),
    },
  });
}
