import type { RoleCode } from "@prisma/client";
import type { SessionPayload } from "@/types/auth";

export const CAPABILITIES = {
  MASTER_DASHBOARD_VIEW: "master.dashboard.view",
  MASTER_USERS_VIEW: "master.users.view",
  MASTER_SESSIONS_VIEW: "master.sessions.view",
  MASTER_CASH_MONITOR_VIEW: "master.cash_monitor.view",
  MASTER_CAMERAS_VIEW: "master.cameras.view",
  TREASURY_MANAGE: "treasury.manage",
  /** Solo lectura del indicador de efectivo de LA PROPIA sucursal — sin
   * confirmar depósitos, eso sigue siendo TREASURY_MANAGE (prompt-indicador-
   * efectivo-inteligente.md §6: "Admin de sucursal → su sucursal. Panel con
   * acciones" salvo confirmar, que es solo de Master). */
  TREASURY_VIEW_BRANCH: "treasury.view_branch",
  SYSTEM_ADMIN_ACCESS: "system.admin.access",
  SYSTEM_ADMIN_ROLE_CONFIG: "system.admin.role.config",
  SYSTEM_ADMIN_SETTINGS: "system.admin.settings",
  MASTER_ACCESS: "master.access",
  MASTER_USERS_MANAGE: "master.users.manage",
  BRANCH_DASHBOARD_VIEW: "branch.dashboard.view",
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
  // Consolidado acá desde el difunto permissions.ts (PASO R.1: había 3
  // catálogos RBAC y el "limpio" no lo usaba nadie). El cableado en cada
  // ruta se hace a medida que existan los endpoints de Package/Shipment
  // (§12 pasos 2-6, bloqueados). Debe estar espejado en
  // cargo-frontend/src/modules/rbac/policies.ts — el test de paridad lo exige.
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

  // ── Entrega y custodia de efectivo (PASO R.3) ───────────────────────
  // Cobrar (payment.collect) exige ADEMÁS una sesión de caja abierta a nombre
  // del usuario — si no la hay, es 409, no 403 (ver assertCanCollectPayment).
  DELIVERY_HANDOVER: "delivery.handover", // entrega en mostrador
  DELIVERY_LASTMILE: "delivery.lastmile", // entrega a domicilio (última milla)
  CUSTODY_HANDOFF: "custody.handoff",     // entregar efectivo a otra persona
  CUSTODY_RECEIVE: "custody.receive",     // confirmar que se recibió (PASO R.4)

  // ── Vistas de los contextos de logística (PASO R.5 — cascarón de rutas) ──
  SHIPMENT_VIEW: "shipment.view",   // /app/shipments
  CUSTOMS_VIEW: "customs.view",     // /app/customs
  ARRIVAL_RECEIVE: "arrival.receive", // /app/branch/arrivals
  TRACKING_VIEW: "tracking.view",   // /app/tracking (consulta transversal)
} as const;

export type Capability = (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

const ALL_CAPABILITIES = Object.values(CAPABILITIES);

const SYSTEM_ADMIN_ONLY: readonly Capability[] = [
  CAPABILITIES.SYSTEM_ADMIN_ACCESS,
  CAPABILITIES.SYSTEM_ADMIN_ROLE_CONFIG,
  CAPABILITIES.SYSTEM_ADMIN_SETTINGS,
];

/**
 * PASO R.6 — frontera antifraude: `package.measure` (fijar el peso facturable
 * = cuánto se le cobra al cliente) NO lo tiene NADIE por herencia global, ni
 * siquiera MASTER. Solo `WAREHOUSE_ORIGIN`. Una corrección la hace MASTER/OWNER/
 * SYS con `package.measure.correct`, que es auditable y una operación distinta.
 */
const FRAUD_BOUNDARY_ONLY: readonly Capability[] = [CAPABILITIES.PACKAGE_MEASURE];

const globalExcept = (extra: readonly Capability[] = []) =>
  ALL_CAPABILITIES.filter((c) => !FRAUD_BOUNDARY_ONLY.includes(c) && !extra.includes(c));

export const ROLE_CAPABILITIES: Record<RoleCode, Capability[]> = {
  SYSTEM_ADMIN: globalExcept(),
  OWNER: globalExcept(SYSTEM_ADMIN_ONLY),
  MASTER: globalExcept(SYSTEM_ADMIN_ONLY),
  BRANCH_ADMIN: [
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
    CAPABILITIES.WAREHOUSE_VIEW,
    CAPABILITIES.DISPATCH_MARK,
    // ── View capabilities ──
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.SALES_VIEW,
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
    // ── Governance & reporting ──
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
    // ── Courier (PASO R.1: viene de basePermissions del difunto permissions.ts) ──
    CAPABILITIES.CUSTOMER_CREATE,
    CAPABILITIES.CUSTOMER_VIEW,
    CAPABILITIES.CUSTOMER_EDIT,
    CAPABILITIES.PREALERT_CREATE,
    CAPABILITIES.CLAIM_OPEN,
    // ── Cobro y entrega (PASO R.3) — el cobro exige además caja abierta ──
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
    // ── Custodia (PASO R.3) — el cajero dedicado recibe y confirma ──
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
  /// Bodega ORIGEN: recibe, pesa y mide — define el peso facturable.
  WAREHOUSE_ORIGIN: [
    CAPABILITIES.WAREHOUSE_VIEW,
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.DISPATCH_VIEW,
    CAPABILITIES.OPERATIONS_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    CAPABILITIES.DOCUMENT_PRINT,
    // ── Courier (PASO R.1: viene de basePermissions del difunto permissions.ts) ──
    CAPABILITIES.CUSTOMER_VIEW,
    CAPABILITIES.PACKAGE_RECEIVE,
    CAPABILITIES.PACKAGE_MEASURE,
    CAPABILITIES.PREALERT_MATCH,
    CAPABILITIES.PACKAGE_CONSOLIDATE,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.SHIPMENT_VIEW,
    CAPABILITIES.TRACKING_VIEW,
  ],
  /// Bodega DESTINO: consolida, libera y entrega. NUNCA escribe peso/medidas
  /// (frontera antifraude — PRODUCT.md Positioning; sin PACKAGE_MEASURE*).
  WAREHOUSE_DESTINATION: [
    CAPABILITIES.WAREHOUSE_VIEW,
    CAPABILITIES.DISPATCH_MARK,
    CAPABILITIES.BRANCH_DASHBOARD_VIEW,
    CAPABILITIES.DISPATCH_VIEW,
    CAPABILITIES.OPERATIONS_VIEW,
    CAPABILITIES.APPROVAL_REQUEST_CREATE,
    CAPABILITIES.DOCUMENT_PRINT,
    // ── Courier (PASO R.1: viene de basePermissions del difunto permissions.ts) ──
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
  /// Última milla (PASO R.2). Entrega a domicilio con evidencia. Aguas abajo de
  /// la frontera antifraude: NUNCA pesa ni mide. El cobro contra entrega y la
  /// custodia de efectivo se le conceden en R.3/R.4 (payment.collect + custody.*).
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
    // Entrega el efectivo con custody.handoff; NO puede confirmar recepción
    // (custody.receive) — quien anda en la calle con plata no cierra su cadena.
    CAPABILITIES.PAYMENT_COLLECT,
    CAPABILITIES.DELIVERY_LASTMILE,
    CAPABILITIES.CUSTODY_HANDOFF,
    // -- Logistica (PASO R.5) --
    CAPABILITIES.TRACKING_VIEW,
  ],
  // ─────────────────────────────────────────────────────────────
  // CONTADOR (ACCOUNTANT) — rol global de solo-contabilidad.
  // Ve TODO el módulo de Finanzas & Contabilidad (resumen, gastos,
  // precios/márgenes, planilla, cortes quincenales, fletes, reportes y
  // configuración) y NADA más. No tiene acceso a ventas, inventario, caja,
  // usuarios ni configuración del sistema.
  // ─────────────────────────────────────────────────────────────
  ACCOUNTANT: [
    // Finanzas & Contabilidad — acceso completo (lectura y gestión).
    CAPABILITIES.FINANCE_VIEW,
    CAPABILITIES.FINANCE_MANAGE_EXPENSES,
    CAPABILITIES.FINANCE_VIEW_PAYROLL,
    CAPABILITIES.FINANCE_MANAGE_PAYROLL,
    CAPABILITIES.FINANCE_REPORTS_EXPORT,
    // Capacidades de soporte que consumen los subpaneles de finanzas.
    CAPABILITIES.OPERATING_EXPENSE_VIEW,
    CAPABILITIES.OPERATING_EXPENSE_CREATE,
    CAPABILITIES.CASH_MOVEMENT_VIEW,
    CAPABILITIES.REPORTS_EXPORT,
    // Historial de sus propias consultas/exportaciones.
    CAPABILITIES.SALES_HISTORY_VIEW,
    CAPABILITIES.MASTER_HISTORY_VIEW,
  ],
};

export function can(roleCode: RoleCode, capability: Capability): boolean {
  return ROLE_CAPABILITIES[roleCode]?.includes(capability) ?? false;
}

export function getCapabilitiesForRole(roleCode: RoleCode): Capability[] {
  return ROLE_CAPABILITIES[roleCode] ?? [];
}

/** Minimal session shape required for capability checks */
type CapabilitySession = Pick<SessionPayload, "globalRoles" | "branchMemberships"> | null;

export function canInBranch(session: CapabilitySession, branchId: string, capability: Capability): boolean {
  if (!session || !branchId) return false;
  if (session.globalRoles.includes("SYSTEM_ADMIN")) return can("SYSTEM_ADMIN", capability);
  if (session.globalRoles.includes("OWNER")) return can("OWNER", capability);
  if (session.globalRoles.includes("MASTER")) return can("MASTER", capability);
  // Contador: rol global sin membresías de sucursal. Sus capacidades (solo
  // finanzas) aplican transversalmente a todas las sucursales.
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
  // Contador: rol global de finanzas (sin membresías de sucursal).
  if (session.globalRoles.includes("ACCOUNTANT")) return can("ACCOUNTANT", capability);

  return session.branchMemberships.some((membership) => can(membership.roleCode, capability));
}
