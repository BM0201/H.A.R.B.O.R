# Contexto `identity-access`

**Confianza:** Alta

Usuarios internos, roles, permisos por ubicación, auditoría de acciones. Hereda el modelo de auth/RBAC del fork.

## Estructura

```
identity-access/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
