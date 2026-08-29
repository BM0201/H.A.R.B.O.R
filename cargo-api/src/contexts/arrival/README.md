# Contexto `arrival`

**Confianza:** Media

Arribo a Nicaragua: descarga, verificación, clasificación. Se solapa con Warehouse/Shipment — puede NO ser contexto propio.

## Estructura

```
arrival/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
