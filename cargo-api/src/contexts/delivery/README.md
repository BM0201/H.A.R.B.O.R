# Contexto `delivery`

**Confianza:** Alta

Última milla: entrega en mostrador o a domicilio, con evidencia (firma, foto, cédula). Frontera de fraude: quien entrega NO es quien pesó.

## Estructura

```
delivery/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
