# `src/contexts/` — Bounded Contexts hexagonales (HARBOR)

ADR-0002 (monolito modular) + ADR-0003 (hexagonal por contexto).
Ver `docs/ARQUITECTURA-HARBOR.md`.

## Por qué existe esta carpeta y no `src/modules/`

`src/modules/**` son los módulos **heredados** de HAMMER: planos, con
`prisma` importado directo en `service.ts`, sin separación de capas. Funcionan y
no se reescriben por gusto (auth, tesorería, día operativo, caja, planilla,
auditoría).

`src/contexts/**` son los bounded contexts **nuevos** del dominio logístico,
estructurados en cuatro capas. Los módulos heredados migran aquí de forma
**incremental**, contexto por contexto, cuando toque tocarlos — no en un big-bang.

## La convención (obligatoria para todo `contexts/*`)

```
src/contexts/<contexto>/
  domain/          entidades, value objects, eventos de dominio, invariantes.
                   TypeScript PURO. Cero imports de @prisma/client, next/*,
                   @/lib, ni ningún paquete de I/O. El dominio define SUS
                   propias entidades — los tipos de Prisma no cruzan aquí.
  application/     casos de uso. Orquesta el dominio a través de PUERTOS
                   (interfaces). Nunca importa infrastructure/ ni interfaces/.
  infrastructure/  repositorios Prisma, clientes HTTP externos, adaptadores.
                   Implementa los puertos. Mapea Prisma ↔ entidad de dominio.
  interfaces/      route handlers, DTOs, validación de entrada (zod).
                   Capa delgada: HTTP → caso de uso → HTTP.
  index.ts         API PÚBLICA. Lo único importable desde afuera del contexto.
```

**Regla de dependencia:** `interfaces → application → domain`;
`infrastructure → domain`. El dominio no apunta a nadie.

**Fronteras entre contextos:** un contexto solo se importa desde su
`index.ts`. Prohibido `import { X } from "@/contexts/cargo/domain/..."` desde
otro contexto.

## Enforcement

`cargo-api/.dependency-cruiser.cjs` + `npm run arch:check` (corre en CI).
Si el check no está en CI, la arquitectura se erosiona en silencio (ADR-0003).

## Estado

Todos los `index.ts` están **vacíos a propósito**. El modelado del dominio
(agregados, entidades, VOs, invariantes, eventos, máquinas de estado) no arranca
hasta cerrar el §12 paso 3, que depende de las respuestas a los 5 bloqueantes de
`docs/ARQUITECTURA-HARBOR.md`.

Lo que sí está hecho (paso 7): este esqueleto + la regla de dependencias en CI.
