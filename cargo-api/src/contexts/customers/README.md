# Contexto `customers`

**Confianza:** Alta

Perfil del cliente, casillero (code), direcciones, contacto, tier. Depende del bloqueante #1 (¿Cliente = Remitente = Destinatario?).

## Estructura

```
customers/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
