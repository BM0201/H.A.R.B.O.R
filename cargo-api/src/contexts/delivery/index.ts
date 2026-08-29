/**
 * Contexto: delivery  (confianza: Alta)
 *
 * Última milla: entrega en mostrador o a domicilio, con evidencia (firma, foto, cédula). Frontera de fraude: quien entrega NO es quien pesó.
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/delivery/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
