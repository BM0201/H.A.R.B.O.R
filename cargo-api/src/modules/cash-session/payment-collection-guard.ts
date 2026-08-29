/**
 * PASO R.3 — Cobrar es una capacidad, no un rol.
 *
 * Cobrar un pago exige DOS condiciones simultáneas:
 *   1. la capacidad `payment.collect` concedida al rol (por sucursal), y
 *   2. una sesión de caja abierta y vinculada a ese usuario.
 *
 * Con eso, COUNTER / COURIER / CASHIER pueden cobrar si la agencia se lo
 * concede, y ninguno puede cobrar sin gaveta abierta a su nombre. `CASHIER`
 * sobrevive para quien tenga caja dedicada y deja de ser obligatorio.
 *
 * Si tiene la capacidad pero NO la sesión, la respuesta es **409, no 403**:
 * no es un problema de permiso, es de estado — el mensaje debe decir "abrí caja".
 *
 * Los roles globales privilegiados (Master / Owner / SystemAdmin) no necesitan
 * gaveta: son supervisores, no cajeros (misma convención que
 * userCanOperateCashSessionTx).
 *
 * NOTA: todavía no existe una ruta que cobre (se construye con Package/billing,
 * §12 pasos 2-6). Esto deja el contrato listo y testeado para cuando exista.
 */
import type { SessionPayload } from "@/types/auth";
import { CashSessionStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { canInBranch, isPrivilegedGlobal } from "@/modules/rbac/guards";

export class CashSessionRequiredError extends Error {
  constructor(message = "CASH_SESSION_REQUIRED") {
    super(message);
    this.name = "CashSessionRequiredError";
  }
}

export type CollectDecision = "OK" | "FORBIDDEN" | "CASH_SESSION_REQUIRED";

/** Regla pura y testeable: capacidad + gaveta abierta. Global privilegiado pasa. */
export function decideCollect(input: {
  hasCollectCapability: boolean;
  hasOpenCashSession: boolean;
  isPrivilegedGlobal: boolean;
}): CollectDecision {
  if (input.isPrivilegedGlobal) return "OK";
  if (!input.hasCollectCapability) return "FORBIDDEN";
  if (!input.hasOpenCashSession) return "CASH_SESSION_REQUIRED";
  return "OK";
}

/** Devuelve el id de la sesión de caja abierta del usuario en la sucursal, o null. */
export async function findOpenCashSessionForUser(
  userId: string,
  branchId: string,
): Promise<string | null> {
  const openStatuses = [CashSessionStatus.OPEN, CashSessionStatus.RECONCILING];

  const opened = await prisma.cashSession.findFirst({
    where: { openedByUserId: userId, status: { in: openStatuses }, physicalCashBox: { branchId } },
    select: { id: true },
  });
  if (opened) return opened.id;

  const operating = await prisma.cashSessionOperator.findFirst({
    where: {
      userId,
      isActive: true,
      revokedAt: null,
      cashSession: { status: { in: openStatuses }, physicalCashBox: { branchId } },
    },
    select: { cashSessionId: true },
  });
  return operating?.cashSessionId ?? null;
}

/**
 * Lanza si el usuario NO puede cobrar en esta sucursal ahora mismo:
 *  - sin `payment.collect` → `FORBIDDEN_CAPABILITY` (→ 403)
 *  - con la capacidad pero sin gaveta abierta → `CashSessionRequiredError` (→ 409)
 * Si puede, devuelve el id de la sesión (null para un global privilegiado).
 */
export async function assertCanCollectPayment(
  session: SessionPayload | null,
  branchId: string,
): Promise<{ cashSessionId: string | null }> {
  if (!session) throw new Error("FORBIDDEN_CAPABILITY");

  const priv = isPrivilegedGlobal(session);
  const hasCap = canInBranch(session, branchId, CAPABILITIES.PAYMENT_COLLECT);
  const openId = priv || !hasCap ? null : await findOpenCashSessionForUser(session.userId, branchId);

  const decision = decideCollect({
    hasCollectCapability: hasCap,
    hasOpenCashSession: Boolean(openId),
    isPrivilegedGlobal: priv,
  });

  if (decision === "FORBIDDEN") throw new Error("FORBIDDEN_CAPABILITY");
  if (decision === "CASH_SESSION_REQUIRED") throw new CashSessionRequiredError();
  return { cashSessionId: openId };
}
