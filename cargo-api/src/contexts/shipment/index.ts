/**
 * Contexto: shipment  (confianza: Alta)
 *
 * Embarque aéreo/marítimo: carrier, AWB/BL, contenedor, ETD/ETA, y el PRORRATEO de costo total sobre las líneas (patrón heredado, se reimplementa en application/).
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/shipment/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
