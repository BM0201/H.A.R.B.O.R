/**
 * HARBOR PASO U.2 — helpers de autorización de los route handlers del mostrador.
 */
import type { SessionPayload } from "@/types/auth";
import { CAPABILITIES } from "@/modules/rbac/policies";
import { canInBranch, getBranchIdsWithCapability, isPrivilegedGlobal } from "@/modules/rbac/guards";

export const COUNTER_CAPS = {
  VIEW: CAPABILITIES.CUSTOMER_VIEW,
  HANDOVER: CAPABILITIES.DELIVERY_HANDOVER,
  COLLECT: CAPABILITIES.PAYMENT_COLLECT,
} as const;

/** Sucursal del mostrador: la provista (si tiene acceso) o la primera con customer.view. */
export function resolveCounterBranch(
  session: SessionPayload,
  provided: string | null | undefined,
): { branchId: string } | { error: "FORBIDDEN_BRANCH" | "NO_COUNTER_BRANCH" } {
  if (provided) {
    if (isPrivilegedGlobal(session) || canInBranch(session, provided, COUNTER_CAPS.VIEW)) return { branchId: provided };
    return { error: "FORBIDDEN_BRANCH" };
  }
  const branches = getBranchIdsWithCapability(session, COUNTER_CAPS.VIEW);
  if (branches.length > 0) return { branchId: branches[0] };
  if (isPrivilegedGlobal(session) && session.primaryBranchId) return { branchId: session.primaryBranchId };
  return { error: "NO_COUNTER_BRANCH" };
}

export function canHandoverAt(session: SessionPayload, branchId: string): boolean {
  return isPrivilegedGlobal(session) || canInBranch(session, branchId, COUNTER_CAPS.HANDOVER);
}
