import { getCurrentSession } from "@/modules/auth/service";
import { assertAuthenticated } from "@/modules/auth/access";
import { approvalService, assertNoSelfApproval } from "@/modules/approvals/service";
import { resolveApprovalSchema } from "@/modules/approvals/validators";
import { canInAnyAssignedBranch, canInBranch, CAPABILITIES } from "@/modules/rbac/policies";
import { isMaster } from "@/modules/rbac/guards";
import { toHttpErrorResponse } from "@/lib/http";
import { requireCsrf } from "@/modules/security/csrf";
import { ok, fail } from "@/lib/api/response";
import { logAuditEvent } from "@/modules/audit/service";
import { executeApprovedRetainedCashExpense } from "@/modules/treasury/service";

// NOTA(cargo): las ramas de STOCK_ADJUSTMENT / DISPATCH_OVERRIDE / PRICE_OVERRIDE
// / SaleReturn / SaleCancellation se eliminaron con el motor de producto y el
// motor de devoluciones de ferretería. Queda RETAINED_CASH_EXPENSE (tesorería) y
// el camino genérico. Las nuevas acciones del courier se agregan aquí.
async function denySelfReview(request: { requestedByUserId: string; branchId: string; id: string }, actorUserId: string) {
  try {
    assertNoSelfApproval(request.requestedByUserId, actorUserId);
  } catch (error) {
    await logAuditEvent({
      actorUserId,
      branchId: request.branchId,
      module: "approvals",
      action: "APPROVAL_SELF_REVIEW_DENIED",
      entityType: "ApprovalRequest",
      entityId: request.id,
      metadataJson: { reason: "SELF_APPROVAL_BLOCKED" },
    });
    throw error;
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentSession();
    assertAuthenticated(session);
    await requireCsrf(request, session);

    if (!canInAnyAssignedBranch(session, CAPABILITIES.APPROVAL_REQUEST_REVIEW)) {
      return fail("FORBIDDEN", "Forbidden", 403);
    }

    const { id } = await context.params;
    const parsed = resolveApprovalSchema.safeParse(await request.json());

    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid payload", 400);
    }

    const approval = await approvalService.getRequestById(id);
    if (!approval) {
      return fail("NOT_FOUND", "Not found", 404);
    }

    if (!isMaster(session) && !canInBranch(session, approval.branchId, CAPABILITIES.APPROVAL_REQUEST_REVIEW)) {
      return fail("FORBIDDEN", "Forbidden", 403);
    }

    const fallbackReason = (parsed.data.resolutionNotes?.trim() && parsed.data.resolutionNotes.trim().length >= 3)
      ? parsed.data.resolutionNotes.trim()
      : "Resuelto desde la cola de aprobaciones.";

    let data: { requestId: string; status: string };

    if (approval.referenceType === "RETAINED_CASH_EXPENSE") {
      await denySelfReview(approval, session.userId);
      const resolved = await approvalService.resolveRequest({
        requestId: id,
        actorUserId: session.userId,
        decision: parsed.data.decision,
        resolutionNotes: parsed.data.resolutionNotes,
      });
      data = resolved;
      if (parsed.data.decision === "APPROVE") {
        try {
          const payload = approval.payloadJson as {
            branchId: string; category: string; description: string; amount: number; receiptReference: string; safeAccountId: string;
          } | null;
          if (!payload) throw new Error("RETAINED_CASH_EXPENSE_PAYLOAD_MISSING");
          await executeApprovedRetainedCashExpense({
            actorUserId: session.userId,
            payload: payload as Parameters<typeof executeApprovedRetainedCashExpense>[0]["payload"],
          });
        } catch (executionError) {
          await logAuditEvent({
            actorUserId: session.userId,
            branchId: approval.branchId,
            module: "approvals",
            action: "RETAINED_CASH_EXPENSE_EXECUTION_FAILED",
            entityType: "ApprovalRequest",
            entityId: approval.id,
            metadataJson: {
              reason: executionError instanceof Error ? executionError.message : "UNKNOWN",
            },
          });
          throw executionError;
        }
      }
    } else {
      // Tipos sin acción real conocida (ej. históricos CASH_SESSION_DISCREPANCY,
      // o tipos declarados en el enum pero aún sin flujo de creación real).
      void fallbackReason;
      data = await approvalService.resolveRequest({
        requestId: id,
        actorUserId: session.userId,
        decision: parsed.data.decision,
        resolutionNotes: parsed.data.resolutionNotes,
      });
    }

    return ok(data);
  } catch (error) {
    if (error instanceof Error && error.message === "APPROVAL_SELF_REVIEW_FORBIDDEN") {
      return fail("FORBIDDEN", "No puedes aprobar o rechazar una solicitud creada por ti mismo.", 403);
    }
    if (error instanceof Error && error.message === "APPROVAL_ALREADY_RESOLVED") {
      return fail("CONFLICT", error.message, 409);
    }
    return toHttpErrorResponse(error);
  }
}
