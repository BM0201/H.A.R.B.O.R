/**
 * Contexto: identity-access  (confianza: Alta)
 *
 * Usuarios internos, roles, permisos por ubicación, auditoría de acciones. Hereda el modelo de auth/RBAC del fork.
 *
 * API PÚBLICA del contexto. Lo único importable desde otros contextos o desde
 * src/app/**. Nada de src/contexts/identity-access/{domain,application,infrastructure,interfaces}
 * se importa directamente desde afuera (enforced en CI).
 *
 * Vacío a propósito: el modelado del dominio no arranca hasta cerrar el §12
 * paso 3 (ver docs/ARQUITECTURA-HARBOR.md).
 */

export {};
