# Contexto `consolidation`

**Confianza:** Alta

Agrupación de N paquetes en un consolidado, previo a asignarlo a un embarque.

## Estructura

```
consolidation/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
