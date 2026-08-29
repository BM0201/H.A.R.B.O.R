# Contexto `customs`

**Confianza:** Baja

Aduana. §7: NO asumir alcance. Depende del bloqueante #4. Puede ser un contexto completo o un par de campos de estado.

## Estructura

```
customs/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
