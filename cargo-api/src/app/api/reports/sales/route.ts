import { resolveReportRequest, reportResponse } from "@/modules/reports/http";
import { toCsv } from "@/modules/reports/serializers";
import { getSalesReportRows } from "@/modules/reports/service";
import { toHttpErrorResponse } from "@/lib/http";

// En CARGO "sales" es fila por pago POSTED — ver getSalesReportRows en
// reports/service.ts. El detalle por artículo del POS de ferretería se eliminó.
const COLUMNS = [
  "fecha",
  "sucursal_codigo",
  "sucursal_nombre",
  "orden",
  "estado",
  "metodo",
  "vendedor",
  "total",
];

export async function GET(request: Request) {
  try {
    const resolved = await resolveReportRequest(request);
    if ("error" in resolved) return resolved.error;

    const { rows, totalCount } = await getSalesReportRows({
      branchIds: resolved.branchIds,
      dateFrom: resolved.query.dateFrom,
      dateTo: resolved.query.dateTo,
      status: resolved.query.status,
    });

    return reportResponse(resolved, "reporte-ventas.csv", toCsv(COLUMNS, rows), rows, "sales", totalCount);
  } catch (error) {
    return toHttpErrorResponse(error);
  }
}
