/**
 * Contexto: cargo  (confianza: Alta)
 *
 * AGREGADO RAÍZ. Paquete: medidas, peso, valor declarado, evidencias, y el LOG DE EVENTOS autoritativo (ADR-0005). El status es proyección. Depende del bloqueante #1.
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/cargo/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
