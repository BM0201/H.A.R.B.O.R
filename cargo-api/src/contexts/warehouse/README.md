# Contexto `warehouse`

**Confianza:** Media

Ubicación y capacidad dentro de un almacén. ¿Rack/bin internos o solo "está en Miami"? (bloqueante #7).

## Estructura

```
warehouse/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
