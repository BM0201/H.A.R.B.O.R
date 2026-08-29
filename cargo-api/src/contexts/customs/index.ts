/**
 * Contexto: customs  (confianza: Baja)
 *
 * Aduana. §7: NO asumir alcance. Depende del bloqueante #4. Puede ser un contexto completo o un par de campos de estado.
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/customs/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
