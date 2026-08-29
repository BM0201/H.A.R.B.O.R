# Contexto `receiving`

**Confianza:** Alta

Recepción e identificación en USA: pesa, mide, fotografía, asigna dueño. Primer vertical slice (paso 9). Depende del bloqueante #2 (¿pre-alerta? ¿manifiesto?).

## Estructura

```
receiving/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
