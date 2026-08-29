# Prompts de implementación (archivo)

Documentos de especificación que guiaron la reconversión de HAMMER (POS/ERP de
ferretería) en HARBOR (courier / carga aérea y marítima). Se archivan aquí como
registro de **qué se pidió y por qué**, no como documentación viva.

| Archivo | Qué define | Estado de ejecución |
|---|---|---|
| `CARGO-FASE-0-dominio-y-esquema.md` | Fase 0 original: fork, amputación del motor de producto, dominio courier (Customer/Casillero, Package, Shipment, tarifario, analítica, Brain, vista 360) | Pasos 0.1 (identidad) y 0.2 (amputación) ejecutados. 0.3–0.8 pendientes |
| `CARGO-FASE-0A-amputacion-remodelado-y-roles.md` | Reemplaza/detalla el paso 0.2: amputación (PASO A), remodelado de 19 modelos a dominio courier (PASO B), roles y permisos (PASO C) | PASO A/B/C ejecutados. `Package` aún no existe (se crea en 0.4) |
| `HARBOR-fundacion-arquitectonica.md` | Fundación arquitectónica de HARBOR: ADRs 0001–0006, actores, bounded contexts, bloqueantes de dominio, secuencia §12 | ADR-0002/0003/0004 aceptados. Paso 7 (esqueleto + regla de CI) ejecutado. Ver `docs/ARQUITECTURA-HARBOR.md` |

El registro consolidado del estado actual vive en `docs/ARQUITECTURA-HARBOR.md` y
`docs/EJECUCION-FASE-0-0A.md`.
