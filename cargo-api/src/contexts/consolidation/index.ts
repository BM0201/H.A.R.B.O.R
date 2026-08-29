/**
 * Contexto: consolidation  (confianza: Alta)
 *
 * Agrupación de N paquetes en un consolidado, previo a asignarlo a un embarque.
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/consolidation/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
