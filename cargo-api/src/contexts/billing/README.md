# Contexto `billing`

**Confianza:** Baja

Cobro y conciliación. §7: modelo financiero definitivo, posterior. Depende del bloqueante #3 (¿se embarca sin pagar?).

## Estructura

```
billing/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
