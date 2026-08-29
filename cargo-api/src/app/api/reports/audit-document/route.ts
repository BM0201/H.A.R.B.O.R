import { NextResponse } from "next/server";
import { resolveReportRequest } from "@/modules/reports/http";
import { buildAuditDocumentPdf, type AuditDocumentSection } from "@/modules/reports/pdf";
import { getReportDefinition } from "@/modules/reports/report-definitions";
import {
  getSalesReportRows,
  getPaymentsReportRows,
  getApprovalsReportRows,
  getAuditReportRows,
} from "@/modules/reports/service";
import { toHttpErrorResponse } from "@/lib/http";

// CAMBIO 5 (prompt-reportes-v2): documento único de rango largo (mes X a mes
// Y), constructor de secciones — cada sección reusa su propio reporte ya
// existente (mismas funciones de reports/service.ts que /api/reports/*),
// nunca una query paralela. El PDF se arma con buildAuditDocumentPdf, que
// reusa el mismo render de sección que cada reporte individual (pdf.ts).
const SECTION_KEYS = [
  "sales-detail",
  "payments",
  "approvals",
  "audit",
] as const;
type SectionKey = (typeof SECTION_KEYS)[number];

const SECTION_LABEL: Record<SectionKey, string> = {
  "sales-detail": "Ventas / cobros",
  payments: "Cobros y métodos de pago",
  approvals: "Aprobaciones",
  audit: "Bitácora de auditoría",
};

export async function GET(request: Request) {
  try {
    const resolved = await resolveReportRequest(request);
    if ("error" in resolved) return resolved.error;

    const { searchParams } = new URL(request.url);
    const rawSections = (searchParams.get("sections") ?? SECTION_KEYS.join(",")).split(",").map((s) => s.trim());
    const selected = new Set(rawSections.filter((key): key is SectionKey => (SECTION_KEYS as readonly string[]).includes(key)));

    const baseFilters = {
      branchIds: resolved.branchIds,
      dateFrom: resolved.query.dateFrom,
      dateTo: resolved.query.dateTo,
    };

    const sections: AuditDocumentSection[] = [];

    if (selected.has("sales-detail")) {
      const { rows, totalCount } = await getSalesReportRows(baseFilters);
      sections.push({ label: SECTION_LABEL["sales-detail"], reportDefinition: getReportDefinition("sales"), rows, totalRowCount: totalCount });
    }
    if (selected.has("payments")) {
      const { rows, totalCount } = await getPaymentsReportRows(baseFilters);
      sections.push({ label: SECTION_LABEL.payments, reportDefinition: getReportDefinition("payments"), rows, totalRowCount: totalCount });
    }
    if (selected.has("approvals")) {
      const rows = await getApprovalsReportRows(baseFilters);
      sections.push({ label: SECTION_LABEL.approvals, reportDefinition: getReportDefinition("approvals"), rows });
    }
    if (selected.has("audit")) {
      const { rows, totalCount } = await getAuditReportRows(baseFilters);
      sections.push({ label: SECTION_LABEL.audit, reportDefinition: getReportDefinition("audit"), rows, totalRowCount: totalCount });
    }

    const pdf = buildAuditDocumentPdf({
      businessName: "BM CARGO",
      rangeLabel: `${resolved.dateFromLabel ?? "sin límite"} – ${resolved.dateToLabel ?? "sin límite"}`,
      branchLabel: resolved.branchLabel ?? "Todas las sucursales",
      generatedBy: resolved.generatedBy,
      sections,
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "content-type": "application/pdf",
        "content-disposition": "attachment; filename=\"documento-auditoria.pdf\"",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
