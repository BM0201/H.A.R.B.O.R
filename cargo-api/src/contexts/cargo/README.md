# Contexto `cargo`

**Confianza:** Alta

AGREGADO RAÍZ. Paquete: medidas, peso, valor declarado, evidencias, y el LOG DE EVENTOS autoritativo (ADR-0005). El status es proyección. Depende del bloqueante #1.

## Estructura

```
cargo/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
