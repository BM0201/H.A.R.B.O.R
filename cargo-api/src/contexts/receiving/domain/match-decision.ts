/**
 * HARBOR PASO S.2 — La decisión del match. Función PURA.
 *
 * La llave es el TRACKING normalizado, nunca el nombre (§S.2: "Match por nombre
 * está prohibido"). El nombre corrobora, no decide.
 *
 * Entra: el tracking normalizado, la lista de pre-alertas abiertas que
 * comparten ese tracking normalizado, y la modalidad leída del prefijo de la
 * etiqueta (`AirBmCargo` → AIR, `MarBmCargo` → SEA). Sale: qué hacer.
 */

export type MatchMode = "AIR" | "SEA";

export type OpenPreAlert = {
  id: string;
  customerId: string;
  mode: MatchMode;
  /** normalizado ya, igual que el del paquete */
  originTrackingNumber: string;
};

export type MatchDecision =
  | { kind: "ASSIGN"; preAlertId: string; customerId: string; mode: MatchMode }
  | { kind: "MODE_MISMATCH"; preAlertId: string; customerId: string; preAlertMode: MatchMode; labelMode: MatchMode }
  | { kind: "ORPHAN"; reason: "NO_PREALERT" }
  | { kind: "AMBIGUOUS"; preAlertIds: string[] };

/**
 * @param normalizedTracking  tracking del paquete, ya normalizado
 * @param openPreAlerts        pre-alertas SIN match con ese mismo tracking normalizado
 * @param labelMode            modalidad del prefijo de la etiqueta, o null si no se pudo leer
 */
export function decideMatch(
  normalizedTracking: string,
  openPreAlerts: readonly OpenPreAlert[],
  labelMode: MatchMode | null,
): MatchDecision {
  const hits = openPreAlerts.filter((p) => p.originTrackingNumber === normalizedTracking);

  if (hits.length === 0) {
    return { kind: "ORPHAN", reason: "NO_PREALERT" };
  }

  // 3d — imposible por el @unique(customerId, originTrackingNumber) salvo que
  // dos clientes distintos pre-alerten el mismo tracking. Nunca elegir uno.
  if (hits.length > 1) {
    return { kind: "AMBIGUOUS", preAlertIds: hits.map((h) => h.id) };
  }

  const preAlert = hits[0];

  // 3b — match único pero la modalidad de la etiqueta contradice la declarada.
  // Cambia el precio ($6 vs $2.50 / lb): NO auto-asignar, va a revisión humana.
  if (labelMode !== null && labelMode !== preAlert.mode) {
    return {
      kind: "MODE_MISMATCH",
      preAlertId: preAlert.id,
      customerId: preAlert.customerId,
      preAlertMode: preAlert.mode,
      labelMode,
    };
  }

  // 3a — match único, modalidad coincide (o no se pudo leer de la etiqueta).
  return { kind: "ASSIGN", preAlertId: preAlert.id, customerId: preAlert.customerId, mode: preAlert.mode };
}
