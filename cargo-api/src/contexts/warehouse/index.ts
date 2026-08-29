/**
 * Contexto: warehouse  (confianza: Media)
 *
 * Ubicación y capacidad dentro de un almacén. ¿Rack/bin internos o solo "está en Miami"? (bloqueante #7).
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/warehouse/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
