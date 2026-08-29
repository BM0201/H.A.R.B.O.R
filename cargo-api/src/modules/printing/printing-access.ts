/**
 * Helpers de autorización para rutas de impresión.
 * Carga el recurso real desde la BD y verifica acceso de sucursal.
 * Lanza "FORBIDDEN: ..." si la sesión no tiene acceso.
 */

import { prisma } from "@/lib/prisma";
import { hasBranchAccess } from "@/modules/rbac/guards";
import type { SessionPayload } from "@/types/auth";

export async function requireSaleOrderPrintAccess(
  session: SessionPayload,
  saleOrderId: string,
): Promise<void> {
  const order = await prisma.saleOrder.findUnique({
    where: { id: saleOrderId },
    select: { branchId: true },
  });
  if (!order) throw new Error("NOT_FOUND: orden de venta no encontrada");
  if (!hasBranchAccess(session, order.branchId)) {
    throw new Error("FORBIDDEN: sin acceso a los documentos de esta sucursal");
  }
}

