# HARBOR

**Producto:** HARBOR · **Empresa:** BM CARGO
Sistema de courier / carga aérea y marítima (modelo casillero: el cliente compra
en el exterior, el paquete llega a la bodega de origen, se consolida, viaja, pasa
aduana y se entrega).

## Origen del código

Este monorepo **deriva de un fork de H.A.M.M.E.R.** (un POS/ERP de ferretería:
Next.js 15 + Prisma + PostgreSQL/Neon). El motor de producto/inventario de la
ferretería fue **amputado** y el dominio se está reconvirtiendo al de logística.
Lo que se hereda deliberadamente son patrones probados en producción: el
prorrateo de costo sobre N líneas, el día operativo, el cierre de caja con
arqueo, el modelo de auditoría, la tesorería y la planilla nicaragüense.

Los workspaces conservan el prefijo `cargo-` por ahora; el nombre de producto es
HARBOR (renombrarlos no aporta valor inmediato).

## Estructura

```
cargo-api/        Backend API-only (Next.js 15 route handlers + Prisma).
                  src/modules/    — módulos heredados de HAMMER (planos)
                  src/contexts/   — bounded contexts hexagonales nuevos (ADR-0003)
cargo-frontend/   Frontend UI-only (Next.js 15). Habla con la API vía rewrites.
cargo-agent/      Agente de sucursal para el módulo Cámaras (ONVIF). Intacto.
docs/             Registro de arquitectura, ejecución y prompts de origen.
```

## Documentación clave

| Archivo | Qué es |
|---|---|
| `docs/ARQUITECTURA-HARBOR.md` | Registro de ADRs (0001–0006), actores, bounded contexts, bloqueantes de dominio, secuencia §12 |
| `docs/EJECUCION-FASE-0-0A.md` | Qué se hizo hasta ahora: Fase 0 (identidad + amputación), Fase 0.A (remodelado + roles), HARBOR paso 7 |
| `docs/prompts/` | Los prompts de especificación que guiaron el trabajo (archivo) |
| `AUDITORIA-HAMMER.md` | Auditoría del POS de ferretería original (contexto histórico) |
| `cargo-api/src/contexts/README.md` | La convención hexagonal por contexto y su enforcement |

## Estado actual

- **Fase 0.1** (identidad del fork) y **0.2** (amputación del motor de producto): hechas.
- **Fase 0.A** (amputación fina + remodelado de 19 modelos al dominio courier + roles): hecha.
- **HARBOR §12 paso 7** (esqueleto de bounded contexts + regla de dependencias en CI): hecha.
- `Package` **no existe todavía** — se crea en la Fase 0.4.
- **Bloqueado:** el modelado del dominio (agregados, eventos, máquinas de estado)
  espera respuestas a los 5 bloqueantes duros de `docs/ARQUITECTURA-HARBOR.md`.

### Verificación

```bash
# cargo-api
cd cargo-api && npm ci
npm run prisma:validate && npm run typecheck && npm run arch:check && npm test

# cargo-frontend
cd ../cargo-frontend && npm ci
npm run typecheck && npm run lint && npm run test:unit && npm run test:unit:logic && npm run validate:critical

# cargo-agent
cd ../cargo-agent && npm ci && npm run typecheck && npm test
```

Todo verde. `cargo-api`: 570 tests. Sin base de datos: `prisma migrate` / `seed`
quedan como paso manual (ver `docs/EJECUCION-FASE-0-0A.md`).

## Stack

Next.js 15 (App Router) · Prisma 6 · PostgreSQL (Neon) · TypeScript 5.9 · Node 22.
Arquitectura: monolito modular, hexagonal por contexto (ADR-0002/0003/0004).
