# Contexto `shipment`

**Confianza:** Alta

Embarque aéreo/marítimo: carrier, AWB/BL, contenedor, ETD/ETA, y el PRORRATEO de costo total sobre las líneas (patrón heredado, se reimplementa en application/).

## Estructura

```
shipment/
  domain/          entidades, VOs, eventos, invariantes (TS puro)
  application/     casos de uso, puertos
  infrastructure/  repos Prisma, adaptadores
  interfaces/      route handlers, DTOs, validación
  index.ts         API pública
```

Regla de dependencia enforced por `cargo-api/.dependency-cruiser.cjs`
(`npm run arch:check`).
