/**
 * Contexto: billing  (confianza: Baja)
 *
 * Cobro y conciliación. §7: modelo financiero definitivo, posterior. Depende del bloqueante #3 (¿se embarca sin pagar?).
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/billing/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
