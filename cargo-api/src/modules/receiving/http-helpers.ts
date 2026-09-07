/**
 * HARBOR PASO S — helpers compartidos por los route handlers de recepción.
 * La UI oculta, el SERVIDOR autoriza (PASO R.1): toda ruta revalida por su
 * cuenta con estos helpers, no confía en que el botón estuviera escondido.
 */
import type { SessionPayload } from "@/types/auth";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { canInBranch, getBranchIdsWithCapability, isPrivilegedGlobal } from "@/modules/rbac/guards";

export const RECEIVING_CAPS = {
  RECEIVE: CAPABILITIES.PACKAGE_RECEIVE,
  MEASURE: CAPABILITIES.PACKAGE_MEASURE,
  MEASURE_CORRECT: CAPABILITIES.PACKAGE_MEASURE_CORRECT,
} as const;

/**
 * Resuelve la sucursal de origen sobre la que se está recibiendo:
 *  - si el request trae una, verifica que el usuario tenga `package.receive` ahí;
 *  - si no, toma la primera sucursal asignada donde tenga `package.receive`.
 * Un global privilegiado sin membresías cae a `null` (recibe sin sucursal — el
 * caso normal es un WAREHOUSE_ORIGIN de sucursal).
 */
export function resolveOriginBranch(
  session: SessionPayload,
  provided: string | null | undefined,
): { branchId: string | null } | { error: "FORBIDDEN_BRANCH" | "NO_RECEIVING_BRANCH" } {
  if (provided) {
    if (isPrivilegedGlobal(session) || canInBranch(session, provided, RECEIVING_CAPS.RECEIVE)) {
      return { branchId: provided };
    }
    return { error: "FORBIDDEN_BRANCH" };
  }
  const branches = getBranchIdsWithCapability(session, RECEIVING_CAPS.RECEIVE);
  if (branches.length > 0) return { branchId: branches[0] };
  if (isPrivilegedGlobal(session)) return { branchId: session.primaryBranchId ?? null };
  return { error: "NO_RECEIVING_BRANCH" };
}

/** ¿Puede el usuario pesar (fijar el peso facturable) en esta sucursal? */
export function canMeasureAt(session: SessionPayload, branchId: string | null): boolean {
  if (isPrivilegedGlobal(session)) return true;
  if (!branchId) return false;
  return canInBranch(session, branchId, RECEIVING_CAPS.MEASURE);
}

export function canCorrectMeasureAt(session: SessionPayload, branchId: string | null): boolean {
  if (isPrivilegedGlobal(session)) return true;
  if (!branchId) return false;
  return canInBranch(session, branchId, RECEIVING_CAPS.MEASURE_CORRECT);
}
