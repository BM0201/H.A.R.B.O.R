# Contexto `locations`

**Confianza:** Alta

Entidad Location con CAPACIDADES EXPLÍCITAS (canReceiveFromCarrier, canWeigh, canStore, canDeliverToCustomer, canProcessCustoms). Reemplaza el Branch plano. Requiere lista real de locales (bloqueante #8).

## Estructura

```
locations/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
