/**
 * HARBOR — máquina de estados del paquete (PRODUCT.md lifecycle).
 *
 * `status` es PROYECCIÓN del log de eventos (ADR-0005). PASO S modeló el tramo
 * de recepción; PASO U agrega el recorrido completo con transiciones MANUALES
 * (`POST /api/packages/:id/advance`) — la lógica real de consolidación,
 * embarque, aduana y distribución llega en sus pasos.
 *
 * TypeScript puro — la lista de estados se replica acá a propósito para no
 * importar `@prisma/client` en `domain/`.
 */

export type PackageStatus =
  | "PRE_ALERTED"
  | "RECEIVED_ORIGIN"
  | "ORPHAN"
  | "CONSOLIDATED"
  | "IN_TRANSIT"
  | "IN_CUSTOMS"
  | "AVAILABLE"
  | "DELIVERED"
  | "RETURNED"
  | "LOST"
  | "DAMAGED";

/** El "camino feliz" en orden — para dibujar la línea de tiempo del portal. */
export const HAPPY_PATH: readonly PackageStatus[] = [
  "PRE_ALERTED",
  "RECEIVED_ORIGIN",
  "CONSOLIDATED",
  "IN_TRANSIT",
  "IN_CUSTOMS",
  "AVAILABLE",
  "DELIVERED",
];

/** Estados que un paquete puede tener sin haber salido de la operación normal. */
export const TERMINAL: readonly PackageStatus[] = ["DELIVERED", "RETURNED", "LOST", "DAMAGED"];

/** Excepciones alcanzables desde casi cualquier punto (con aprobación / registro). */
const INCIDENTS: readonly PackageStatus[] = ["LOST", "DAMAGED", "RETURNED"];

const ALLOWED: Record<PackageStatus, readonly PackageStatus[]> = {
  PRE_ALERTED: ["RECEIVED_ORIGIN", "ORPHAN"],
  // Un huérfano al que un humano le asigna dueño pasa a recibido.
  ORPHAN: ["RECEIVED_ORIGIN"],
  RECEIVED_ORIGIN: ["CONSOLIDATED", ...INCIDENTS],
  CONSOLIDATED: ["IN_TRANSIT", "RECEIVED_ORIGIN", ...INCIDENTS], // se puede des-consolidar
  IN_TRANSIT: ["IN_CUSTOMS", "AVAILABLE", ...INCIDENTS],
  IN_CUSTOMS: ["AVAILABLE", ...INCIDENTS],
  AVAILABLE: ["DELIVERED", ...INCIDENTS],
  DELIVERED: ["RETURNED"], // el cliente devuelve algo entregado
  RETURNED: [],
  LOST: [],
  DAMAGED: ["RETURNED", "DELIVERED"], // se resuelve el reclamo y se entrega igual, o se devuelve
};

export function canTransition(from: PackageStatus, to: PackageStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertTransition(from: PackageStatus, to: PackageStatus): void {
  if (from === to) return;
  if (!canTransition(from, to)) {
    throw new Error(`ILLEGAL_PACKAGE_TRANSITION: ${from} -> ${to}`);
  }
}

export function nextStatuses(from: PackageStatus): readonly PackageStatus[] {
  return ALLOWED[from] ?? [];
}

/** Estados en los que el paquete todavía NO tiene dueño confirmado. */
export function isUnowned(status: PackageStatus): boolean {
  return status === "ORPHAN";
}

export function isTerminal(status: PackageStatus): boolean {
  return TERMINAL.includes(status);
}

/**
 * Efectos de proyección de una transición sobre las columnas denormalizadas de
 * `Package`. Función pura: el repo Prisma aplica lo que devuelve.
 */
export type TransitionEffects = {
  /** setear `availableAt = now` (arranca el reloj de almacenaje) */
  markAvailableNow: boolean;
  /** setear `deliveredAt = now` */
  markDeliveredNow: boolean;
  /** el paquete requiere una sucursal destino en la transición */
  requiresDestinationBranch: boolean;
};

export function transitionEffects(to: PackageStatus): TransitionEffects {
  return {
    markAvailableNow: to === "AVAILABLE",
    markDeliveredNow: to === "DELIVERED",
    requiresDestinationBranch: to === "AVAILABLE",
  };
}
