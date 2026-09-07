/**
 * HARBOR PASO S — máquina de estados del paquete, tramo de recepción.
 *
 * `status` es PROYECCIÓN del log de eventos (ADR-0005). Estas transiciones son
 * las que el camino de recepción puede producir; el resto del recorrido
 * (CONSOLIDATED, IN_TRANSIT, …) se agrega en sus pasos.
 *
 * TypeScript puro — la lista de estados se replica acá a propósito para no
 * importar `@prisma/client` en `domain/`.
 */

export type PackageStatus = "PRE_ALERTED" | "RECEIVED_ORIGIN" | "ORPHAN";

/** Transiciones permitidas hoy. Una clave ausente = estado terminal para este slice. */
const ALLOWED: Record<PackageStatus, readonly PackageStatus[]> = {
  // Un huérfano al que un humano le asigna dueño pasa a recibido.
  ORPHAN: ["RECEIVED_ORIGIN"],
  // Un paquete pre-alertado que llega físicamente pasa a recibido (o a huérfano
  // si el match falla — ese camino crea el paquete directo en su estado final).
  PRE_ALERTED: ["RECEIVED_ORIGIN", "ORPHAN"],
  RECEIVED_ORIGIN: [],
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

/** Estados en los que el paquete todavía NO tiene dueño confirmado. */
export function isUnowned(status: PackageStatus): boolean {
  return status === "ORPHAN";
}
