/**
 * Contexto: receiving  (confianza: Alta)
 *
 * Recepción e identificación en USA: pesa, mide, fotografía, asigna dueño. Primer vertical slice (paso 9). Depende del bloqueante #2 (¿pre-alerta? ¿manifiesto?).
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/receiving/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
