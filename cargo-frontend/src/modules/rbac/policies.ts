// Copia frontend del catálogo RBAC (desacoplada de @prisma/client).
// DEBE ser idéntica al backend cargo-api/src/modules/rbac/policies.ts —
// lo verifica tests/unit-ts/rbac-parity.test.ts (corre en CI). La UI oculta,
// el servidor autoriza: este archivo existe solo para no mostrar botones muertos.
import type { RoleCode, SessionPayload } from "@/types/auth";

export const CAPABILITIES = {
  SYSTEM_ADMIN_ACCESS: "system.admin.access",
  SYSTEM_ADMIN_ROLE_CONFIG: "system.admin.role.config",
  SYSTEM_ADMIN_SETTINGS: "system.admin.settings",
  MASTER_ACCESS: "master.access",
  MASTER_DASHBOARD_VIEW: "master.dashboard.view",
  MASTER_USERS_VIEW: "master.users.view",
  MASTER_USERS_MANAGE: "master.users.manage",
  MASTER_SESSIONS_VIEW: "master.sessions.view",
  MASTER_CASH_MONITOR_VIEW: "master.cash_monitor.view",
  MASTER_CAMERAS_VIEW: "master.cameras.view",
  TREASURY_MANAGE: "treasury.manage",
  TREASURY_VIEW_BRANCH: "treasury.view_branch",
  CASH_VIEW: "cash.view",
  CASH_OPEN: "cash.open",
  CASH_CLOSE: "cash.close",
  CASH_SESSION_MANAGE: "cash.session.manage",
  CASH_BOX_VIEW: "cash_box.view",
  CASH_BOX_MANAGE: "cash_box.manage",
  CASH_SESSION_OPEN: "cash_session.open",
  CASH_SESSION_ASSIGN_OPERATOR: "cash_session.assign_operator",
  CASH_SESSION_USE: "cash_session.use",
  CASH_SESSION_CLOSE_REQUEST: "cash_session.close_request",
  CASH_SESSION_RECONCILE: "cash_session.reconcile",
  CASH_SESSION_CLOSE_FINAL: "cash_session.close_final",
  PAYMENT_QUEUE_VIEW: "payment.queue.view",
  PAYMENT_COLLECT: "payment.collect",
  PAYMENT_VOID: "payment.void",
  PAYMENT_REFUND: "payment.refund",
  PAYMENT_PRINT_RECEIPT: "payment.print_receipt",
  CASH_MOVEMENT_CREATE: "cash_movement.create",
  CASH_MOVEMENT_APPROVE: "cash_movement.approve",
  CASH_MOVEMENT_VIEW: "cash_movement.view",
  OPERATING_EXPENSE_VIEW: "operating_expense.view",
  OPERATING_EXPENSE_CREATE: "operating_expense.create",
  // ── Finanzas & Contabilidad ──
  FINANCE_VIEW: "finance.view",
  FINANCE_MANAGE_EXPENSES: "finance.manage_expenses",
  FINANCE_VIEW_PAYROLL: "finance.view_payroll",
  FINANCE_MANAGE_PAYROLL: "finance.manage_payroll",
  FINANCE_REPORTS_EXPORT: "finance.reports_export",
  WAREHOUSE_VIEW: "warehouse.view",
  BRAIN_VIEW: "brain.view",
  BRAIN_ACTIONS_MANAGE: "brain.actions.manage",
  BRANCH_DASHBOARD_VIEW: "branch.dashboard.view",
  SALES_VIEW: "sales.view",
  CASH_PAYMENTS_VIEW: "cash.payments.view",
  CASH_SESSION_OPERATE: "cash.session.operate",
  CASH_REVIEW: "cash.review",
  CASH_AUTO_CLOSE_REVIEW: "cash.auto_close.review",
  OPERATIONS_VIEW: "operations.view",
  OPERATIONS_MANAGE: "operations.manage",
  OPERATIONAL_DAY_OPEN: "operations.day.open",
  OPERATIONAL_DAY_CLOSE: "operations.day.close",
  OPERATIONAL_DAY_APPROVE_DELEGATE: "operational_day.approve.delegate",
  DISPATCH_VIEW: "dispatch.view",
  DISPATCH_MARK: "dispatch.mark",
  APPROVAL_REQUEST_CREATE: "approval.request.create",
  APPROVAL_REQUEST_REVIEW: "approval.request.review",
  AUDIT_VIEW: "audit.view",
  REPORTS_EXPORT: "reports.export",

  // ── Documentos e Impresión (FASE 3) ──
  DOCUMENT_PRINT: "document.print",
  DOCUMENT_REPRINT: "document.reprint",
  DOCUMENT_SKIP_PRINT: "document.skip.print",
  DOCUMENT_TEMPLATE_MANAGE: "document.template.manage",
  MANUAL_INVOICE_REGISTER: "manual.invoice.register",
  MANUAL_INVOICE_CANCEL: "manual.invoice.cancel",
  PRINT_SETTINGS_MANAGE: "print.settings.manage",
  PRINT_LOG_VIEW: "print.log.view",
  SALES_HISTORY_VIEW: "sales.history.view",
  MASTER_HISTORY_VIEW: "master.history.view",

  // ── Dominio courier (CARGO Fase 0.A) ────────────────────────────────
  // Espejo de cargo-api/src/modules/rbac/policies.ts (PASO R.1). El test de
  // paridad (tests/unit-ts/rbac-parity.test.ts) falla si difieren.
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_VIEW: "customer.view",
  CUSTOMER_EDIT: "customer.edit",
  CUSTOMER_TIER_OVERRIDE: "customer.tier.override",
  PACKAGE_RECEIVE: "package.receive",
  PACKAGE_MEASURE: "package.measure",
  PACKAGE_MEASURE_CORRECT: "package.measure.correct",
  PACKAGE_CONSOLIDATE: "package.consolidate",
  PACKAGE_RELEASE: "package.release",
  PACKAGE_DELIVER: "package.deliver",
  PACKAGE_STATUS_OVERRIDE: "package.status.override",
  PREALERT_CREATE: "prealert.create",
  PREALERT_MATCH: "prealert.match",
  SHIPMENT_CREATE: "shipment.create",
  SHIPMENT_COST_EDIT: "shipment.cost.edit",
  SHIPMENT_ALLOCATE: "shipment.allocate",
  RATE_VIEW: "rate.view",
  RATE_EDIT: "rate.edit",
  CUSTOMS_DECLARE: "customs.declare",
  CUSTOMS_CLEAR: "customs.clear",
  CLAIM_OPEN: "claim.open",
  CLAIM_RESOLVE: "claim.resolve",
  PROMO_CREATE: "promo.create",
  PROMO_APPROVE: "promo.approve",

  // ── Entrega y custodia de efectivo (PASO R.3) — espejo del backend ──
  DELIVERY_HANDOVER: "delivery.handover",
  DELIVERY_LASTMILE: "delivery.lastmile",
  CUSTODY_HANDOFF: "custody.handoff",
  CUSTODY_RECEIVE: "custody.receive",

  // ── Vistas de los contextos de logística (PASO R.5) — espejo del backend ──
  SHIPMENT_VIEW: "shipment.view",
  CUSTOMS_VIEW: "customs.view",
  ARRIVAL_RECEIVE: "arrival.receive",
  TRACKING_VIEW: "tracking.view",
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

const SYSTEM_ADMIN_ONLY: readonly Capability[] = [
  CAPABILITIES.SYSTEM_ADMIN_ACCESS,
  CAPABILITIES.SYSTEM_ADMIN_ROLE_CONFIG,
  CAPABILITIES.SYSTEM_ADMIN_SETTINGS,
];

export const ROLE_CAPABILITIES: Record<RoleCode, Capability[]> = {
  SYSTEM_ADMIN: [...ALL_CAPABILITIES],
  OWNER: ALL_CAPABILITIES.filter(c => !SYSTEM_ADMIN_ONLY.includes(c)),
  MASTER: ALL_CAPABILITIES.filter(c => !SYSTEM_ADMIN_ONLY.includes(c)),
  BRANCH_ADMIN: [
    // [V2] Legacy cash capabilities kept in sync with backend policies.ts
    CAPABILITIES.CASH_VIEW,
    CAPABILITIES.CASH_OPEN,
    CAPABILITIES.CASH_CLOSE,
    CAPABILITIES.CASH_SESSION_MANAGE,
    CAPABILITIES.CASH_BOX_VIEW,
    CAPABILITIES.CASH_BOX_MANAGE,
    CAPABILITIES.CASH_SESSION_OPEN,
    CAPABILITIES.CASH_SESSION_ASSIGN_OPERATOR,
    CAPABILITIES.CASH_SESSION_USE,
    CAPABILITIES.CASH_SESSION_CLOSE_REQUEST,
    CAPABILITIES.CASH_SESSION_RECONCILE,
    CAPABILITIES.CASH_SESSION_CLOSE_FINAL,
    CAPABILITIES.PAYMENT_QUEUE_VIEW,
    CAPABILITIES.PAYMENT_COLLECT,
    CAPABILITIES.PAYMENT_VOID,
    CAPABILITIES.PAYMENT_REFUND,
    CAPABILITIES.PAYMENT_PRINT_RECEIPT,
    CAPABILITIES.CASH_MOVEMENT_CREATE,
    CAPABILITIES.CASH_MOVEMENT_APPROVE,
    CAPABILITIES.CASH_MOVEMENT_VIEW,
    CAPABILITIES.TREASURY_VIEW_BRANCH,
    CAPABILITIES.OPERATING_EXPENSE_VIEW,
    CAPABILITIES.OPERATING_EXPENSE_CREATE,
    // Finanzas de su sucursal (sin planilla: los salarios no se exponen a admin de sucursal).
    CAPABILITIES.FINANCE_VIEW,
    CAPABILITIES.FINANCE_MANAGE_EXPENSES,
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.SALES_VIEW,
    CAPABILITIES.WAREHOUSE_VIEW,
    CAPABILITIES.DISPATCH_MARK,
    CAPABILITIES.CASH_PAYMENTS_VIEW,
    CAPABILITIES.CASH_SESSION_OPERATE,
    CAPABILITIES.CASH_REVIEW,
    CAPABILITIES.CASH_AUTO_CLOSE_REVIEW,
    CAPABILITIES.OPERATIONS_VIEW,
    CAPABILITIES.OPERATIONS_MANAGE,
    CAPABILITIES.OPERATIONAL_DAY_OPEN,
    CAPABILITIES.OPERATIONAL_DAY_CLOSE,
    CAPABILITIES.OPERATIONAL_DAY_APPROVE_DELEGATE,
    CAPABILITIES.DISPATCH_VIEW,
    // ── Entrega y custodia (PASO R.3) ──
    CAPABILITIES.DELIVERY_HANDOVER,
    CAPABILITIES.DELIVERY_LASTMILE,
    CAPABILITIES.CUSTODY_HANDOFF,
    CAPABILITIES.CUSTODY_RECEIVE,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    CAPABILITIES.APPROVAL_REQUEST_REVIEW,
    CAPABILITIES.AUDIT_VIEW,
    CAPABILITIES.REPORTS_EXPORT,
    // ── Documentos e Impresión (FASE 3) ──
    CAPABILITIES.DOCUMENT_PRINT,
    CAPABILITIES.DOCUMENT_REPRINT,
    CAPABILITIES.DOCUMENT_SKIP_PRINT,
    CAPABILITIES.MANUAL_INVOICE_REGISTER,
    CAPABILITIES.MANUAL_INVOICE_CANCEL,
    CAPABILITIES.PRINT_LOG_VIEW,
    CAPABILITIES.SALES_HISTORY_VIEW,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.SHIPMENT_VIEW,
    CAPABILITIES.CUSTOMS_VIEW,
    CAPABILITIES.ARRIVAL_RECEIVE,
    CAPABILITIES.TRACKING_VIEW,
  ],
  COUNTER: [
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.SALES_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    // ── Courier (PASO R.1) — espejo del backend ──
    CAPABILITIES.CUSTOMER_CREATE,
    CAPABILITIES.CUSTOMER_VIEW,
    CAPABILITIES.CUSTOMER_EDIT,
    CAPABILITIES.PREALERT_CREATE,
    CAPABILITIES.CLAIM_OPEN,
    // ── Cobro y entrega (PASO R.3) ──
    CAPABILITIES.PAYMENT_COLLECT,
    CAPABILITIES.DELIVERY_HANDOVER,
    CAPABILITIES.CUSTODY_HANDOFF,
    // ── Documentos e Impresión (FASE 3) ──
    CAPABILITIES.DOCUMENT_PRINT,
    CAPABILITIES.DOCUMENT_SKIP_PRINT,
    CAPABILITIES.SALES_HISTORY_VIEW,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.TRACKING_VIEW,
  ],
  CASHIER: [
    CAPABILITIES.CASH_VIEW,
    CAPABILITIES.CASH_OPEN,
    CAPABILITIES.CASH_CLOSE,
    CAPABILITIES.CASH_SESSION_MANAGE,
    CAPABILITIES.CASH_BOX_VIEW,
    CAPABILITIES.CASH_SESSION_USE,
    CAPABILITIES.CASH_SESSION_CLOSE_REQUEST,
    CAPABILITIES.PAYMENT_QUEUE_VIEW,
    CAPABILITIES.PAYMENT_COLLECT,
    CAPABILITIES.PAYMENT_PRINT_RECEIPT,
    CAPABILITIES.CASH_MOVEMENT_VIEW,
    CAPABILITIES.CASH_MOVEMENT_CREATE,
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.CASH_PAYMENTS_VIEW,
    CAPABILITIES.CASH_SESSION_OPERATE,
    CAPABILITIES.OPERATIONS_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    // ── Custodia (PASO R.3) ──
    CAPABILITIES.CUSTODY_HANDOFF,
    CAPABILITIES.CUSTODY_RECEIVE,
    // ── Documentos e Impresión (FASE 3) ──
    CAPABILITIES.DOCUMENT_PRINT,
    CAPABILITIES.DOCUMENT_REPRINT,
    CAPABILITIES.MANUAL_INVOICE_REGISTER,
    CAPABILITIES.PRINT_LOG_VIEW,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.TRACKING_VIEW,
  ],
  WAREHOUSE_ORIGIN: [
    CAPABILITIES.WAREHOUSE_VIEW,
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.DISPATCH_VIEW,
    CAPABILITIES.OPERATIONS_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    CAPABILITIES.DOCUMENT_PRINT,
    // ── Courier (PASO R.1) — espejo del backend ──
    CAPABILITIES.CUSTOMER_VIEW,
    CAPABILITIES.PACKAGE_RECEIVE,
    CAPABILITIES.PACKAGE_MEASURE,
    CAPABILITIES.PREALERT_MATCH,
    CAPABILITIES.PACKAGE_CONSOLIDATE,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.SHIPMENT_VIEW,
    CAPABILITIES.TRACKING_VIEW,
  ],
  // Bodega DESTINO: NUNCA escribe peso/medidas (frontera antifraude, sin PACKAGE_MEASURE*).
  WAREHOUSE_DESTINATION: [
    CAPABILITIES.WAREHOUSE_VIEW,
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.DISPATCH_VIEW,
    CAPABILITIES.DISPATCH_MARK,
    CAPABILITIES.OPERATIONS_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    CAPABILITIES.DOCUMENT_PRINT,
    // ── Courier (PASO R.1) — espejo del backend ──
    CAPABILITIES.CUSTOMER_VIEW,
    CAPABILITIES.PACKAGE_CONSOLIDATE,
    CAPABILITIES.PACKAGE_RELEASE,
    CAPABILITIES.PACKAGE_DELIVER,
    CAPABILITIES.DELIVERY_HANDOVER, // entrega en mostrador (PASO R.3)
    // -- Logistica (PASO R.5) --
    CAPABILITIES.SHIPMENT_VIEW,
    CAPABILITIES.CUSTOMS_VIEW,
    CAPABILITIES.ARRIVAL_RECEIVE,
    CAPABILITIES.TRACKING_VIEW,
  ],
  // Última milla (PASO R.2). Aguas abajo de la frontera antifraude: nunca pesa.
  COURIER: [
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.DISPATCH_VIEW,
    CAPABILITIES.DISPATCH_MARK,
    CAPABILITIES.PACKAGE_DELIVER,
    CAPABILITIES.CUSTOMER_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    CAPABILITIES.DOCUMENT_PRINT,
    // ── Cobro contra entrega + custodia (PASO R.3) ──
    // Cobra SOLO con caja abierta a su nombre (assertCanCollectPayment → 409).
    // custody.handoff sí, custody.receive NO (no cierra su propia cadena).
    CAPABILITIES.PAYMENT_COLLECT,
    CAPABILITIES.DELIVERY_LASTMILE,
    CAPABILITIES.CUSTODY_HANDOFF,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.TRACKING_VIEW,
  ],
  // ─────────────────────────────────────────────────────────────
  // CONTADOR (ACCOUNTANT) — solo-contabilidad. Mantener en sync con backend.
  // ─────────────────────────────────────────────────────────────
  ACCOUNTANT: [
    CAPABILITIES.FINANCE_VIEW,
    CAPABILITIES.FINANCE_MANAGE_EXPENSES,
    CAPABILITIES.FINANCE_VIEW_PAYROLL,
    CAPABILITIES.FINANCE_MANAGE_PAYROLL,
    CAPABILITIES.FINANCE_REPORTS_EXPORT,
    CAPABILITIES.OPERATING_EXPENSE_VIEW,
    CAPABILITIES.OPERATING_EXPENSE_CREATE,
    CAPABILITIES.CASH_MOVEMENT_VIEW,
    CAPABILITIES.REPORTS_EXPORT,
    CAPABILITIES.SALES_HISTORY_VIEW,
    CAPABILITIES.MASTER_HISTORY_VIEW,
  ],
};

export function can(roleCode: RoleCode, capability: Capability): boolean {
  return ROLE_CAPABILITIES[roleCode]?.includes(capability) ?? false;
}

type CapabilitySession = Pick<SessionPayload, "globalRoles" | "branchMemberships"> | null;

export function canInBranch(session: CapabilitySession, branchId: string, capability: Capability): boolean {
  if (!session || !branchId) return false;
  if (session.globalRoles.includes("SYSTEM_ADMIN")) return can("SYSTEM_ADMIN", capability);
  if (session.globalRoles.includes("OWNER")) return can("OWNER", capability);
  if (session.globalRoles.includes("MASTER")) return can("MASTER", capability);
  if (session.globalRoles.includes("ACCOUNTANT")) return can("ACCOUNTANT", capability);

  return session.branchMemberships
    .filter((membership) => membership.branchId === branchId)
    .some((membership) => can(membership.roleCode, capability));
}

export function canInAnyAssignedBranch(session: CapabilitySession, capability: Capability): boolean {
  if (!session) return false;
  if (session.globalRoles.includes("SYSTEM_ADMIN")) return can("SYSTEM_ADMIN", capability);
  if (session.globalRoles.includes("OWNER")) return can("OWNER", capability);
  if (session.globalRoles.includes("MASTER")) return can("MASTER", capability);
  if (session.globalRoles.includes("ACCOUNTANT")) return can("ACCOUNTANT", capability);

  return session.branchMemberships.some((membership) => can(membership.roleCode, capability));
}
