# HARBOR — Registro de Arquitectura

**Producto:** HARBOR · **Empresa:** BM CARGO
**Base de código:** este monorepo (`cargo-api` / `cargo-frontend` / `cargo-agent`),
derivado del fork de HAMMER con el motor de ferretería ya amputado (ver
`CARGO-FASE-0-*` y `CARGO-FASE-0A-*`). El nombre de producto es HARBOR; los
workspaces conservan el prefijo `cargo-` por ahora — renombrarlos no aporta valor
inmediato.

> **Lectura del ADR-0001.** El documento de fundación propone greenfield puro.
> BM CARGO decidió una lectura pragmática: este documento y el levantamiento de
> dominio sirven para **entender qué estamos construyendo**; la mayoría de las
> piezas ya presentes (auth, tesorería, día operativo, caja, auditoría, planilla)
> no necesitan reescribirse. HAMMER/el fork es la base; el rediseño se aplica
> **de forma incremental** donde el dominio logístico lo exige (Cargo, Receiving,
> Shipment, Delivery, Tracking).

---

## Estado de las decisiones

| ADR | Título | Estado |
|---|---|---|
| 0001 | Greenfield vs fork | ACEPTADO (lectura pragmática: fork como base, rediseño incremental) |
| 0002 | Monolito modular, no microservicios | **ACEPTADO** |
| 0003 | Arquitectura hexagonal por módulo + enforcement en CI | **ACEPTADO** |
| 0004 | Stack Next.js + Prisma + PostgreSQL | **ACEPTADO** |
| 0005 | El evento es la verdad; el estado es proyección | **ACEPTADO (acotado a Cargo/Delivery, proyección síncrona)** — PASO S |
| 0006 | Outbox transaccional para eventos de dominio | **ACEPTADO (contrato + despachador por cron)** — PASO S |

### ADR-0002 — Monolito modular (ACEPTADO)
Un solo deploy, una sola base de datos. Bounded contexts como módulos de frontera
explícita. Se puede partir después si aparece un equipo dedicado o carga real
medida que exija escalar un contexto por separado.

### ADR-0003 — Hexagonal por contexto + CI (ACEPTADO)
Cada bounded context nuevo se estructura en cuatro capas:

```
src/contexts/<contexto>/
  domain/          entidades, value objects, eventos, reglas.
                   TypeScript puro. CERO imports de Prisma, Next, HTTP.
  application/     casos de uso. Orquesta el dominio. Depende de puertos
                   (interfaces), nunca de implementaciones.
  infrastructure/  repositorios Prisma, clientes externos, adaptadores.
                   Implementa los puertos.
  interfaces/      route handlers / DTOs / validación de entrada.
  index.ts         API pública del contexto — lo único importable desde afuera.
```

**Regla de dependencia** (`interfaces → application → domain`; `infrastructure → domain`;
el dominio no apunta a nadie), **enforced en CI** con `dependency-cruiser`
(`npm run arch:check` en `cargo-api`). Sin esto en CI, el ADR es decorativo.

> **Refinamiento de path.** El documento de fundación dice `modules/<contexto>/`.
> Aquí se usa `src/contexts/<contexto>/` para distinguir claramente los contextos
> hexagonales nuevos de los `src/modules/*` heredados (planos, con Prisma directo).
> Los módulos heredados migran a `contexts/` de forma incremental, contexto por
> contexto, cuando toque tocarlos.

### ADR-0004 — Stack Next/Prisma/PostgreSQL (ACEPTADO)
Se conserva. `interfaces/` es capa delgada, no el lugar de la lógica.
**Advertencia Prisma:** los tipos generados NO cruzan a `domain/`. El dominio
define sus propias entidades; `infrastructure/` mapea Prisma ↔ entidad de dominio.

### ADR-0005 — Evento autoritativo / estado como proyección (A DISCUTIR)
**Propuesta:** el log de eventos del paquete es la fuente de verdad; `status` y
`currentLocationId` son proyección denormalizada por rendimiento. Toda transición
escribe un evento inmutable en la misma transacción; el estado se puede
reconstruir recorriendo eventos.

**Puntos a resolver antes de aceptar:**
- ¿El patrón aplica a TODOS los agregados (Cargo, Shipment, Consolidation,
  Delivery) o solo a Cargo? El §6 (19 preguntas) es sobre el paquete.
- Costo real: cada caso de uso que cambia estado escribe 2 filas y nunca puede
  "corregir" estado sin un evento compensatorio. ¿El equipo lo sostiene?
- ¿Se materializa la proyección de forma síncrona (en la misma tx) o vía outbox
  (ADR-0006)? Síncrono es más simple y evita la ventana de inconsistencia.
- Precedente heredado: el "día operativo" de HAMMER ya funciona así de facto
  (snapshot + reconstrucción). Reusar ese patrón, no inventar uno nuevo.

**Recomendación:** aceptar **acotado a Cargo** (y Delivery), proyección síncrona
en la misma transacción, sin CQRS. Revisar extensión a otros agregados cuando
cada uno tenga su máquina de estados (§12 paso 5).

**Resolución (PASO S, 2026-09-07):** ACEPTADO acotado a Cargo. `Package.status` y
`Package.locationId` son proyección; toda transición del camino de recepción
escribe un `CargoTimelineEntry` inmutable (con `seq` monótono por paquete) en la
**misma transacción** que el cambio de estado. Sin CQRS, sin event store
genérico — la tabla es append-only por convención de la capa `application`, no
por trigger. La extensión a Shipment/Consolidation/Delivery se decide cuando cada
uno tenga su máquina de estados.

### ADR-0006 — Outbox transaccional (A DISCUTIR)
**Propuesta:** eventos a tabla `outbox` en la misma tx que el cambio de estado;
un despachador los publica after-commit hacia consumidores (notificaciones,
proyecciones, integraciones). Entrega *at-least-once* → consumidores idempotentes.

**Puntos a resolver antes de aceptar:**
- ¿Hay consumidores reales hoy? Sin notificaciones (WhatsApp/SMS/email están
  "fuera de alcance de Fase 0"), sin integraciones externas confirmadas, el
  outbox es infraestructura sin carga. Puede quedar como **tabla + contrato**
  ahora y despachador cuando exista el primer consumidor.
- ¿Quién corre el despachador? ¿Cron de Vercel (ya hay uno), worker aparte,
  `LISTEN/NOTIFY` de Postgres?
- Relación con ADR-0005: si la proyección de estado es síncrona, el outbox NO es
  para eso — es solo para efectos externos.

**Recomendación:** aceptar el **contrato** (tabla `outbox`, todo evento se
escribe ahí en la tx; formato del payload; regla de idempotencia) y **diferir el
despachador** hasta el primer consumidor real (probablemente notificaciones en
Fase 1).

**Resolución (PASO S, 2026-09-07):** ACEPTADO. `OutboxEvent` se escribe en la
misma tx que el cambio de estado. El despachador corre por **cron de Vercel**
(`/api/system/cron/outbox-dispatch`, junto al de automatización operativa),
entrega *at-least-once* y marca `processedAt`. Idempotencia en dos capas:
`OutboxDelivery(eventId, consumer)` con `@@unique` evita reprocesar por
consumidor, y cada consumidor además deduplica por su propia llave natural
(p. ej. `CustomerNotification.dedupeKey`). Primer consumidor real:
`receiving.package_received.v1` → `CustomerNotification`. El canal de salida real
(WhatsApp/SMS/email) sigue fuera de alcance — el consumidor deja la notificación
en estado `QUEUED`.

---

## Actores (Parte II del doc de fundación)

Derivados del flujo §5. Los marcados **⚠** requieren confirmación de BM CARGO.

| Actor | Contexto principal | Responsabilidad crítica |
|---|---|---|
| Operador de recepción USA | Receiving | Identifica dueño, pesa, mide, fotografía |
| Supervisor de almacén USA | Warehouse | Ubicación, capacidad, corrección de medidas |
| Coordinador de embarque | Consolidation / Shipment | Arma consolidados, asigna a embarque |
| ⚠ Agente aduanero | Customs | ¿Interno o tercero con acceso? |
| Operador de arribo Nicaragua | Arrival | Descarga, verifica, clasifica |
| Personal de sucursal | Branches / Delivery | Recibe distribución, entrega en mostrador |
| Repartidor | Last Mile | Entrega a domicilio, evidencia |
| ⚠ Cajero | Billing | Cobra. ¿Caja física o cobro previo? |
| Administrador de sucursal | transversal | Supervisión local |
| Contabilidad | Billing | Costos de embarque, conciliación |
| Dirección | transversal | Reportes, tarifas, excepciones |
| ⚠ Cliente | portal | ¿Autoservicio o solo consulta interna? |

**Frontera de fraude (no negociable):** quien determina peso/dimensiones
(Receiving USA) **no** puede ser quien entrega al cliente. Ya reflejado en el
schema: `RoleCode.WAREHOUSE_ORIGIN` vs `WAREHOUSE_DESTINATION`
(CARGO-FASE-0A §C.1). El guard de "destino nunca escribe peso" se implementa en
`contexts/cargo` cuando exista `Package` (0.4).

---

## Bounded Contexts (Parte III) — mapa candidato

| Contexto | Confianza | `src/contexts/` | Nota |
|---|---|---|---|
| Identity & Access | Alta | `identity-access/` | Usuarios internos, roles, permisos por ubicación, auditoría |
| Locations | Alta | `locations/` | Entidad `Location` con capacidades explícitas (ver abajo) |
| Customers | Alta | `customers/` | Perfil, direcciones, contacto, casillero |
| Cargo | Alta | `cargo/` | **Agregado raíz.** Paquete, medidas, valor, evidencias, eventos |
| Receiving | Alta | `receiving/` | Recepción e identificación en USA |
| Warehouse | Media | `warehouse/` | ¿Ubicaciones internas rack/bin o solo "está en Miami"? |
| Consolidation | Alta | `consolidation/` | Agrupación de paquetes |
| Shipment | Alta | `shipment/` | Embarque aéreo/marítimo, contenedor, documentación, prorrateo |
| Customs | Baja | `customs/` | §7: no asumir alcance. Bloqueante #4 |
| Arrival | Media | `arrival/` | Se solapa con Warehouse/Shipment. Puede no ser contexto propio |
| Distribution | Media | `distribution/` | Movimiento entre ubicaciones en Nicaragua |
| Delivery | Alta | `delivery/` | Última milla, evidencia de entrega |
| Billing | Baja | `billing/` | §7: modelo financiero definitivo, posterior. Bloqueante #3 |
| **Tracking** | — | — | **NO es contexto.** Proyección de lectura sobre los eventos de todos los demás (ADR-0005) |

### Advertencia sobre Locations
HAMMER tiene `Branch` plano (toda sucursal igual). HARBOR necesita `Location` con
**capacidades explícitas** verificadas en `application/`:
`canReceiveFromCarrier`, `canWeigh`, `canStore`, `canDeliverToCustomer`,
`canProcessCustoms`. Nada de `if (branch.type === ...)` regado por el código.
Requiere la lista real de locales (bloqueante #8).

---

## Bloqueantes duros (Parte IV) — respuestas pendientes de BM CARGO

Sin estas, el modelo de dominio (§12 paso 5) no puede cerrarse. El **paso 7**
(esqueleto + regla de CI) sí puede avanzar en paralelo — y es lo que se está
haciendo.

1. **Modelo de casillero.** ~~¿Dirección propia en USA a nombre del cliente, o
   BM CARGO recibe de remitentes conocidos hacia destinatarios?~~ **RESUELTO
   (PASO S, insumo del dueño):** una sola dirección física en USA (7792 NW 71st
   ST, Doral FL 33166); el cliente rotula al comprar con `AirBmCargo`/`MarBmCargo`
   + su nombre. El cliente es **una** parte; el "remitente" es la tienda (se
   captura como `originCarrier` + `originTrackingNumber`). Agregado raíz `Package`
   con `customerId` opcional (null mientras es `ORPHAN`).
2. **Identificación en recepción.** ~~¿Número de casillero en la etiqueta /
   pre-alerta / manifiesto / resolución manual?~~ **RESUELTO (PASO S):** la llave
   del match es el **tracking del carrier de origen** (impreso y en código de
   barras), no el nombre ni el casillero. Existe `PreAlert` (el cliente la carga
   con el tracking). Match por nombre **prohibido**. Sin pre-alerta que reclame →
   `ORPHAN` con bandeja de trabajo y asignación manual auditada.
3. **Momento del cobro.** ¿Se puede embarcar sin pagar? → si no, el pago es
   precondición de transición y Billing se vuelve bloqueante del flujo central.
   **Sigue abierto** — PASO S calcula la cotización en la recepción pero no cobra;
   la precondición de pago para embarcar se decide antes del PASO de consolidación.
4. **Alcance de aduana.** ¿Despacho directo / agente externo / consolidado sin
   declaración por paquete? → contexto completo vs un par de campos de estado.
5. **Relación real con HAMMER.** ¿Misma empresa que el POS de ferretería? →
   decide si HARBOR comparte directorio de usuarios/auth con HAMMER o solo
   convenciones.

**No bloqueantes pero necesarias antes de cerrar contextos:** 6) ¿un paquete se
divide/agrupa en el camino? · 7) ¿ubicaciones internas rack/bin? · 8) lista real
de locales + capacidades · 9) ¿carga no-cliente-final (corporativa)? · 10) ¿qué
pasa con un paquete que nadie retira — cargo por almacenaje/abandono?

---

## Secuencia (Parte V)

| # | Entregable | Estado |
|---|---|---|
| 1 | Respuestas a los 5 bloqueantes | Pendiente BM CARGO |
| 2 | Mapa de procesos (flujo real, no ideal) | Bloqueado por (1) |
| 3 | Modelo de dominio: agregados, entidades, VOs, invariantes | Bloqueado por (2) |
| 4 | Catálogo de eventos de dominio con payload y consumidores | Bloqueado por (3) |
| 5 | Máquinas de estado por agregado, transiciones prohibidas | Bloqueado por (3) |
| 6 | Matriz de permisos por actor y ubicación | Bloqueado por (3) |
| **7** | **Esqueleto del monorepo + regla de dependencias en CI** | **HECHO** (PASO 7) |
| 8 | Esquema de persistencia y mapeo dominio↔Prisma | Parcial — `Package`/`PreAlert`/`RateCard` acotados a recepción (PASO S); el resto sigue bloqueado por (3) |
| 9 | Primer vertical slice: Receiving completo, HTTP → base | **HECHO acotado a recepción** (PASO S): escáner → match por tracking → pesaje → cotización → outbox. Consolidación/embarque/aduana/entrega en sus pasos |

---

## Convención de módulo (paso 7)

Ver `cargo-api/src/contexts/README.md` y `cargo-api/.dependency-cruiser.cjs`.
