# Ejecución — Fase 0 (0.1 + 0.2) y Fase 0.A (A/B/C) + HARBOR paso 7

Registro de qué se hizo, en qué orden y con qué desviaciones. Fecha: 2026-08-28.
Sin git durante la ejecución; backups locales en `Downloads/`
(`BM CARGO .backup-2026-08-28.zip`, `BM CARGO .checkpoint-0A-2026-08-28.zip`).

Los prompts de origen están en `docs/prompts/`. El registro de arquitectura
consolidado en `docs/ARQUITECTURA-HARBOR.md`.

---

## Fase 0.1 — Identidad del fork

- Directorios renombrados: `hammer-api|frontend|agent` → `cargo-api|frontend|agent`.
- Actualizado: `.github/workflows/ci.yml` (jobs, `working-directory`, ramas
  `["cargo-v1","main"]`), `.github/dependabot.yml`, los 3 `package.json` +
  `package-lock.json`, `playwright.config.ts`, `openapi.yaml`, cookie de sesión
  (`__Host-cargo_session` en API y frontend), health endpoints, `.env.example`,
  `scripts/prisma-validate.mjs`, emails de seed, branding visible (login wordmark
  "CARGO", copyright, `pos-shell`, PDFs, TOTP issuer "BM CARGO", defaults de
  nombre de negocio).
- **Diferido** (rebrand interno, no bloqueante): claves `localStorage`/IndexedDB
  `hammer-*`, clases CSS `.hammer-toggle` / `hammer-tap`, componente
  `HammerSplash`, `sw.js` cache name, comentarios que citan rutas `hammer-api/...`
  en archivos "espejo".

---

## Fase 0.2 — Amputación del motor de producto

### Schema (`cargo-api/prisma/schema.prisma`)
De 3786 → ~2253 líneas. **42 modelos + 23 enums borrados** (Product, Category,
Inventory\*, Timber\*, Production\*, PurchaseOrder\*, SaleReturn/Refund/CreditNote,
Transfer\*, Reorder\*, Replenishment\*, ProductAnalytics, PricingConfig, …).
`Supplier` → `Carrier`. `SaleOrderLine.productId` → `description` + `packageId?`.

### API
- Borrados ~14 módulos + ~40 directorios de rutas + 19 scripts one-off de ferretería.
- **Desviación registrada vs plan aprobado:** además del motor de producto se
  eliminó la superficie transaccional retail — módulos `sales/service`,
  `payments`, `documents`, `dispatch`, y rutas `sales/**`, `pos/**`,
  `cashier/orders`, `cashier/payments`, `warehouse/**`, `master/sales-orders`,
  `printing/sales|purchase-orders|transfers`. `sales/service.ts` eran ~3000 LoC de
  POS-con-inventario; "cortar el FK" no era viable sin reescribirlo. Se
  **conservan como tablas de schema + plumbing**: `SaleOrder`, `SaleOrderLine`,
  `Payment`, `PaymentTender`, `DispatchTicket`, y `sales/realtime-sales-summary`
  (lo usan `operations` y `dashboard`). La facturación del courier se construye
  sobre `Package`/`Shipment` en fase posterior.
- Recortados: `brain` (detectores de producto borrados; engine reducido a
  cash/sales/dispatch/security; `execute-decision` y `outcomes` stubeados),
  `reports`/`finance`/`dashboard`/`operations`/`retention`/`printing` (COGS,
  valuación de inventario, movimientos, ABC-XYZ → cero/stub).
- Nuevo módulo `modules/expenses/` — extraído del `pricing` borrado (los gastos
  operativos sí sirven al courier).
- `openapi.yaml` recortado a auth + admin.
- 74 migraciones legacy movidas a `prisma/migrations_legacy_hammer/`;
  `prisma/migrations/` vacío (`.gitkeep`). Baseline nuevo = paso manual con DB.

### Frontend
- Borrados 11 directorios de `components/` + 22 directorios de rutas +
  tests de POS/pricing/producción. Nav (`app-sidebar`) recortado.
  `validate-critical-files.mjs` reescrito. `layout.tsx`: `PosShell` →
  `AppShellRouter`.

### Gaps runtime conocidos (no bloquean CI; UI de ferretería que se rediseña en 0.3+)
- `master/page.tsx` (Command Center): panel de sale-orders → `/api/master/sales-orders` (borrado).
- `master/audit/print-logs/page.tsx`: botones de reimpresión → rutas de documento borradas.
- Comentarios/config inertes con "producto"/"InventoryMovement" en
  `reports/report-definitions.ts`, `finance/service.ts`, `rbac/policies.ts`.

---

## Fase 0.A — Amputación (A), Remodelado (B), Roles (C)

Ver `docs/prompts/CARGO-FASE-0A-amputacion-remodelado-y-roles.md`.

### PASO B — Remodelado del schema
- **Enums nuevos:** `TransportMode`, `CarrierType`, `BenefitScope`, `ClaimType`,
  `ClaimStatus`, `TransportServiceStatus`.
- `ProrationMethod` ampliado (`BY_CHARGEABLE_WEIGHT` / `BY_VOLUME` /
  `BY_DECLARED_VALUE` / `MANUAL`); `SaleOrderStatus` sin `RETURN_*`;
  `BrainDecisionCategory` swap (fuera INVENTORY/REORDER/PURCHASING/PRODUCTION →
  dentro LOYALTY/PRICING_CUSTOMER/CUSTOMS/STORAGE); `ApprovalType`
  (`RETURN`→`CLAIM_SETTLEMENT`, `+PACKAGE_MEASURE_CORRECTION`); `ExpenseCategory`
  (fuera `TRANSPORT` → `+FREIGHT_PURCHASE/CUSTOMS_FEES/WAREHOUSE_ORIGIN/LAST_MILE`).
- **Modelos:** `Customer` sin `address`. `SaleOrder.customerId` **obligatorio**.
  `SaleOrderLine` `+chargeableLb/rateCardTierId/freightAmount/customsAmount/storageAmount`
  y `packageId` (sin relación aún). `InternalFreightRoute` → **`Lane`**.
  `InternalFreightTrip` → **`Shipment`**. `InternalFreightTripLine` → **`ShipmentLine`**
  (recreado). `Carrier` `+carrierType/scacCode`. `Discount` sin
  `productIds/abcCategories/xyzCategories` → `targetTiers/targetSegments/targetMode/minPackages90d/benefitScope`.
  `BrainDecision` `+customerId` + índice. `DispatchTicket` `saleOrderId` opcional,
  `+recipientName/recipientIdNumber/signatureUrl`, `+DispatchTicketPackage` (puente).
  `TransportService` recreado remodelado (`customerId` FK, `driverUserId`, `truckId`,
  `addressId`). `BranchModuleConfig` +5 flags courier.
  **Nuevos:** `Claim`, `ClaimEvidence`, `CustomerUser`, `CustomerSession`.
- **No hecho** (deliberado): `SaleOrder` → `Waybill` (el prompt lo marca opcional;
  menos churn en 12 índices + código).

### PASO C — Roles y permisos
- `RoleCode`: `SALES` → **`COUNTER`**; `WAREHOUSE` → **`WAREHOUSE_ORIGIN`** +
  **`WAREHOUSE_DESTINATION`** (roles disjuntos: origen define el peso facturable,
  destino entrega). Propagado en api + frontend: `rbac/permissions.ts`,
  `rbac/policies.ts` (×2), `role-routing` (×2), `dashboard/access`,
  `users`/`branches` validators + service, labels de `treasury/service`, `seed`,
  tests, `role-colors`, `types/auth`.
- `permissions.ts`: catálogo courier agregado como **fuente única**
  (`customer.*`, `package.*`, `prealert.*`, `shipment.*`, `rate.*`, `customs.*`,
  `claim.*`, `promo.*`). El cableado en cada ruta se hará a medida que se creen
  los endpoints de Package/Shipment (0.4+).
- `seed.ts` reescrito: agencia origen (MIA) + destino (MGA), 1 usuario demo por
  rol, `BranchRoleConfig` sembrado, `CustomerUser` demo.
- `cargo-frontend/middleware.ts`: ruteo `/portal/**` (cliente) separado de
  `/app/**` (staff), cookie `__Host-cargo_portal_session` distinta.
- **Diferido a 0.4:** guard "`WAREHOUSE_DESTINATION` nunca escribe
  `weightLb`/`chargeableLb`" (`Package` aún no existe). Test "`CustomerUser` no
  alcanza `/api/master`" (auth de cliente = Fase 2).
- **Diferido a 0.5:** CRUD `/api/carriers` (las rutas `/api/suppliers` se
  borraron en 0.2).

---

## HARBOR — §12 paso 7 (esqueleto + regla de dependencias en CI)

Ver `docs/ARQUITECTURA-HARBOR.md`. ADR-0002/0003/0004 aceptados; 0005/0006 a discutir.

- `docs/ARQUITECTURA-HARBOR.md` — registro de ADRs, actores, bounded contexts,
  bloqueantes de dominio, secuencia §12.
- `cargo-api/.dependency-cruiser.cjs` — reglas del ADR-0003 sobre
  `src/contexts/**` (`domain/` no importa `application/infrastructure/interfaces/`
  ni Prisma/Next/`@/lib`/I-O; `application/` no importa `infrastructure/interfaces/`
  ni Prisma; sin imports profundos entre contextos; sin ciclos).
  `npm run arch:check` + step nuevo en CI (job `api`, antes de tests).
  Verificado que la regla muerde (probe `import PrismaClient` en `domain/` → error).
- `cargo-api/src/contexts/` — 13 bounded contexts scaffoldeados con
  `domain/application/infrastructure/interfaces/` + `index.ts` **vacío a
  propósito** + README con confianza y bloqueante. `src/contexts/README.md`
  explica la convención y por qué es carpeta aparte de `src/modules/` (legacy).

---

## Estado de verificación (2026-08-28)

| Workspace | typecheck | tests | otros |
|---|---|---|---|
| cargo-api | ✅ | **570/570** ✅ | `prisma validate` ✅ · `arch:check` ✅ (395 módulos, 0 violaciones) |
| cargo-frontend | ✅ | unit 12/12 · logic 10/10 ✅ | lint ✅ (3 warnings pre-existentes) · `validate:critical` ✅ |
| cargo-agent | ✅ | 72/72 ✅ | intacto (módulo de cámaras ONVIF) |

- Schema: **76 modelos, 50 enums, ~2518 líneas** (era 177 modelos+enums / 3786).
- Cero llamadas prisma vivas a modelos borrados; cero imports `@/modules/<borrado>`.
- `Package` **no existe todavía** — se crea en 0.4.
- Tests heredados de tesorería / caja / día operativo / nómina: intactos. Solo se
  tocaron tests de RBAC de rutas ya borradas.

---

## Migración baseline — hecha (2026-08-29)

`prisma/migrations/20260829134307_harbor_baseline/` — 2561 líneas, 77 tablas +
50 enums. Generada y aplicada contra un Postgres local efímero; el SQL es
schema-derivado y aplica igual en Neon.

### Verificación de "versión local" (2026-08-29)
- `prisma migrate dev` → baseline creada y aplicada (77 tablas). ✅
- `npm run db:seed` → 2 agencias (MIA/MGA), 7 usuarios (master + 6 demo por rol),
  10 `BranchRoleConfig`, 1 `Customer` + 1 `CustomerUser`. ✅
- `cargo-api` dev en `:4000` + `cargo-frontend` dev en `:3000`, ambos arriba. ✅
- `POST /api/auth/login` valida contra el hash argon2 en DB y rutea por rol:
  `master` → `/app/change-password`, `admin-agencia` → `/app/branch`. ✅
- Roles courier visibles en datos: `WAREHOUSE_ORIGIN`@MIA, `WAREHOUSE_DESTINATION`@MGA,
  `COUNTER`/`CASHIER`/`BRANCH_ADMIN`@MGA.

### Para la base real (Neon)
```bash
# cargo-api/.env → DATABASE_URL + DIRECT_URL de la base Neon (fresca)
cd cargo-api
npx prisma migrate deploy   # aplica el baseline ya versionado
npm run db:seed
```
Credenciales demo: `master / Dev@Seed#2024!LocalOnly` · resto `Cargo1234!` ·
cliente portal `cliente@example.com / Cargo1234!`.

---

## PASO 8 — Marca, identidad visual y seguridad (en curso, 2026-08-29)

Spec: `docs/prompts/HARBOR-PASO-8-marca-identidad-y-seguridad.md`. No toca dominio.

- **Skill `impeccable`** instalada en `.claude/skills/impeccable/` (`npx impeccable
  skills install`). `.claude/skills/` gitignoreado — es un paquete externo, se
  reinstala. Sus hooks se mergearon en `.claude/settings.local.json` (local).
- **`PRODUCT.md`** (raíz) escrito con el `init` de impeccable — describe BM CARGO
  y su modelo de casillero (dirección única en USA + número de casillero por
  cliente + pre-alertas que el cliente ingresa).
- **PASO A — barrido de marca (hecho).** `HARBOR` sin puntos como forma única
  (no es acrónimo). 28 archivos + rename `hammer-splash.tsx` → `harbor-splash.tsx`
  (`HammerSplash` → `HarborSplash`). Icono de marca lucide `Hammer` → `Anchor`.
  Wordmark `H.A.M.M.E.R.` / `CARGO` → `HARBOR` (el pie sigue "© BM CARGO", que es
  la empresa). Clases `.hammer-toggle*` → `.harbor-toggle*`, `@keyframes
  hammer-tap` → `brand-tap`, evento `hammer:access-changed` → `harbor:…`, keys
  `localStorage` `hammer-*` → `harbor-*` en los no-heredados. Quedan 4 keys
  `hammer.*` a propósito en módulos heredados (brain, cash-session, finance,
  payroll) — se renombran al migrar a `contexts/` (ADR-0007). Cookies y
  workspaces **no** se renombraron (van en su ventana, invalidan sesiones).
- **PASO B.1 — tema claro por defecto (hecho).** Anti-FOUC en `app/layout.tsx` y
  `applyUserTheme` en `theme-toggle.tsx`: default `'light'`, ya no se consulta
  `prefers-color-scheme`. El oscuro sigue disponible por toggle. El cascade CSS
  ya era `[data-theme="dark"]`-driven.
- Verde tras A + B.1: `cargo-api` typecheck + `npm test` 570/570 + `arch:check`;
  `cargo-frontend` typecheck + lint + `validate:critical` + unit + logic.

### PASO 8 — lo que falta

- **B.2 paleta** — decidido: **"grafito + acento petróleo"** (marca grafito frío
  casi neutra; un acento petróleo/cian hue ~205 OKLCH usado <10% en enlaces,
  foco, botón primario). Falta implementar: rampa `--color-brand-*` → grafito,
  nuevo `--color-accent-*` petróleo, repuntar `--color-primary-*` y
  `*:focus-visible` (hoy → `master` azul), re-tintar neutros fríos (hoy stone
  cálida, `#ECEBE7` está en la banda crema que el MD rechaza), actualizar las
  paletas inline de `login/page.tsx` y `harbor-splash.tsx`, verificar contraste
  bajo luz ambiente alta. Quitar dead CSS `.hm-gradient-text` y `.hm-glass`.
- **B.3 tipografía** — mono con glifos `0/O 1/l/I` desambiguados app-wide (hoy
  DM Mono solo en `/login`; es aceptable) + `tabular-nums` en columnas numéricas.
- **PASO C** — rampa de etapa (recorrido de tono OKLCH ordenado) ortogonal a los
  semáforos heredados; todo estado = color + ícono + etiqueta; grep-test que
  falle si un color de estado se define fuera de `globals.css`.
- **PASO D** — `data-density="warehouse"|"office"` que remapea espaciado y
  target size por tokens; un solo árbol de componentes. Token manual + TODO al
  bloqueante de `Location`.
- **PASO E** — E.1 código público de tracking no enumerable + vista pública
  mínima + rate-limit + alcance por sesión (contrato del portal, aún sin portal);
  E.2 URLs firmadas para evidencias + acotar `img-src` (hoy `'self' data: https:`);
  E.3 auditar que toda ruta revalida permiso server-side; E.4 auditar usos de
  `localStorage` (sin PII de paquete).

Pendiente cosmético relacionado: las rampas de rol en CSS todavía dicen `sales` y
`warehouse` (el enum ya es `COUNTER` / `WAREHOUSE_ORIGIN` / `WAREHOUSE_DESTINATION`).

---

## PASO R — Roles, RBAC, custodia y cascarón de rutas (rama `harbor-paso-r`)

Spec: `docs/prompts/HARBOR-PASO-R-roles-rbac-custodia.md` (versión corregida — la
primera decía que había 2 catálogos RBAC; hay 3 y el limpio estaba muerto).
**En una rama aparte**, `main` intacto.

- **R.0 (`30a223c`)** — guarda del seed. `src/lib/seed-guard.ts`
  `assertSeedTarget()` anclado a `127.0.0.1|localhost:5433/harbor_dev` (no
  substring); `NODE_ENV=production` aborta sin escape; no imprime la URL. 6 tests.
- **R.1a (`7a36229`)** — consolidación RBAC. Había 3 catálogos: `permissions.ts`
  (courier-limpio, **0 rutas lo usaban**), `policies.ts` backend (vivo, stale),
  `policies.ts` frontend (copia a mano). Mudadas las 24 claves courier a
  `policies.ts`, eliminado `permissions.ts` + `guards.ts::hasPermission`.
  `tests/unit-ts/rbac-parity.test.ts` (CI): falla si back≠front.
- **R.1b (`4835f73`)** — poda de 56 capacidades de módulos amputados (pos,
  inventory, production, purchases, transfers, sale-returns, pricing…). `−281`
  líneas. `moduleFlags`/`ModuleFlags` sin los flags muertos. `policies.test.ts`
  reescrito (probaba POS → ahora la frontera antifraude).
- **R.2 (`5fdc9ed`)** — rol `COURIER` (última milla). Migración
  `20260829184756_add_courier_role` (`ALTER TYPE "RoleCode" ADD VALUE`),
  aplicada al Postgres local. 14 archivos (enum, validators, service, policies
  back/front, frontend types/colors/admin, seed usuario "repartidor").
  `resolveRoleHome` NO tocado — `COURIER` cae al default como `COUNTER`; el
  mapeo completo va en R.5.
- **R.3 (`9afac80`)** — cobrar es capacidad, no rol. Consolidadas las 4
  capacidades de cobro en `payment.collect`. Nuevas: `delivery.handover/lastmile`,
  `custody.handoff/receive`. Guard `payment-collection-guard.ts`:
  `decideCollect()` puro — sin capacidad → 403, con capacidad y sin gaveta →
  **409** (`CASH_SESSION_REQUIRED`). Aún sin ruta que cobre; contrato listo.
- **R.4 (`3e6d351`)** — `confirmCustodyReceipt`, cierra el hueco #1 de
  `PENDIENTES.md`. **Sin modelo nuevo** (respeta la decisión de
  `cash-monitor.ts`: el saldo de la cuenta `CUSTODY` es el estado). Migración
  `20260829190818_custody_receipt_confirmed` (+ `TreasuryEntryType.HANDOVER_CONFIRMED`).
  `treasury/custody.ts` puro (`custodyReceiptOutcome`, `netUnconfirmedPersonHandoff`);
  `service.ts::confirmCustodyReceipt` espeja `confirmBankDeposit` —
  `holderUserId != confirmedByUserId`, `DISPUTED` → `ApprovalRequest` sin
  transferir, `MATCH` → transferencia interna portador→receptor.
  `requestCloseCashSession`: neto de entregas en persona sin confirmar > 0 →
  **409** `UNCONFIRMED_CUSTODY_HANDOFF` (los depósitos a banco no cuentan).

- **R.5 (`4967629`)** — cascarón de rutas de logística. 10 páginas nuevas bajo
  `/app/` con `<RouteShell>` (estado vacío = documentación: "Bloqueado por: … /
  Requiere: …"): `warehouse/{receiving,stock,consolidation}`, `shipments`,
  `customs`, `branch/{arrivals,dispatch}`, `delivery`, `customers`, `tracking`.
  4 capacidades nuevas (`shipment.view`, `customs.view`, `arrival.receive`,
  `tracking.view`). `resolveRoleHome` completo (api + frontend): cada rol a su
  pantalla, ninguno al default (que queda como red + `console.warn`). Sidebar:
  sección LOGISTICA derivada de `LOGISTICS_ROUTES` (`href: Route`, `capability`
  obligatoria — un href inexistente o sin capacidad no compila). Verificado en
  vivo: bodega-origen → `/app/warehouse/receiving`, etc.
- **R.6 + R.7 (`ffb7d55`)** — la "matriz semilla" es `ROLE_CAPABILITIES` (se
  construyó incremental en R.1–R.5). Frontera antifraude en el catálogo:
  `package.measure` ya no se hereda por rol global — ni MASTER lo tiene, solo
  `WAREHOUSE_ORIGIN`; los globales corrigen con `package.measure.correct`.
  `BranchRoleConfig` es rol×sucursal (boolean); el override de capacidad por
  agencia es feature aparte (schema + `canInBranch`), documentada como pendiente.
  Tests: MASTER no pesa pero corrige; CASHIER sin nada de bodega; `test.todo`
  del guard de peso en servicio (reclama existir cuando exista `Package`).

**PASO R completo** — 10 commits en `harbor-paso-r`, `main` intacto. Migraciones
nuevas: `add_courier_role`, `custody_receipt_confirmed`. Sin ruta HTTP para
`confirmCustodyReceipt` ni para el cobro courier (van con el módulo de última
milla, que depende de `Package`).

---

## PASO S — Receiving, escáner y match de pre-alerta (rama `harbor-paso-s`)

Spec: `docs/prompts/HARBOR-PASO-S-receiving-y-escaner.md`. Primer vertical slice
del §12 paso 9. **Rama desde `harbor-paso-r`** (S depende de R; R sin mergear).
Crea el agregado `Package`, acotado al camino de recepción.

- **Decisiones D-1/D-2** — registradas en `PRODUCT.md` como abiertas del dueño,
  con el comportamiento interino del código: capturar L/W/H siempre y cobrar
  sobre peso real (`volumetricDivisor` null en todas las tarifas); guardar ambos
  pesos, facturar el de origen, `weightVariance` + flag cuando |Δ| > 5%.
- **ADR-0005/0006** aceptados acotados a Cargo (registrado en
  `ARQUITECTURA-HARBOR.md`). Bloqueantes #1 y #2 resueltos con insumo del dueño.
- **S.1 (`7d5435b`)** — schema: `Package`, `PreAlert`, `RateCard`,
  `CargoTimelineEntry` (seq monótono, `@@unique(packageId, seq)`), `OutboxEvent`
  + `OutboxDelivery`, `CustomerNotification`, `ReceivingQueueItem`.
  `enum PackageStatus { PRE_ALERTED RECEIVED_ORIGIN ORPHAN }`. Migración
  `20260907120000_receiving_package_slice` generada offline con `migrate diff`
  (no hay DB local) — aplica con `prisma migrate deploy`.
- **S.2/S.3 puro (`c0507dc`)** — contextos hexagonales `cargo`, `rating`,
  `receiving` (arch:check verde). `generateTrackingCode` no enumerable;
  `normalizeCarrierTracking` (IMpb / 1Z / FedEx / TBA); `decideMatch`
  (llave = tracking, nombre PROHIBIDO); `resolveRate` + `computeQuote`
  (`max(real, volumétrico) × tarifa`, piso mínimo, sin tarifa → error).
- **Rutas + infra + outbox (`34f1fbb`)** — `prisma-receiving-repository`
  (Package + timeline + outbox en una `$tx`); despachador de outbox con store
  inyectable + cron cada 5 min; consumidor `package_received` →
  `CustomerNotification` (queda `QUEUED`). Rutas `/api/receiving/**` y
  `/api/rating/rate-cards`. Pesar → 403 para `WAREHOUSE_DESTINATION`/`COURIER`.
- **Tests (`8ba31b7` + guard)** — 66 tests nuevos: normalización, match, tabla
  de cotización (12 casos), `trackingCode` no secuencial, D-1/D-2, dispatcher
  idempotente, `receivePackage` con repo falso. El `test.todo` de PASO R sobre
  el guard de peso pasa a test real.
- **Seed + frontend** — `RateCard` general + 2 pre-alertas demo;
  `/app/warehouse/receiving` (escanear→pesar→recibir) y `/app/warehouse/orphans`
  (bandeja + asignación manual) dejan de ser `RouteShell`.

**Fuera de alcance (sin cambios):** consolidación/embarque/aduana/entrega;
reconciliación de los dos pesajes (D-2); política de huérfanos no reclamados;
ingesta automática desde WhatsApp; canal real de notificación.

## Lo que sigue

- **Bloqueante #3 (pago previo al embarque)** — confirmar antes del paso de
  consolidación: define si la cotización de recepción se vuelve precondición.
- Consolidación → Shipment/prorrateo → aduana → arribo → distribución → entrega,
  cada uno su paso. `CustomerAnalytics` RFM, Brain LOYALTY, vista 360.
- El resto de los 5 bloqueantes duros para cerrar el modelo de dominio (§12 3-6).

---

## PASO U — Portal del cliente, mostrador y tableros (rama `harbor-paso-u`)

Spec: `docs/prompts/HARBOR-PASO-U-portal-mostrador-y-tableros.md`. **Rama desde
`harbor-paso-s`.** El MD referencia PASO T (`PackageQuote`) que no existe: se usó
el snapshot congelado al facturar. El recorrido posterior a la recepción se
agregó con transiciones MANUALES (decisión del dueño en la ejecución).

- **Schema (`21a3f13`)** — `PackageStatus` completo (+ CONSOLIDATED, IN_TRANSIT,
  IN_CUSTOMS, AVAILABLE, DELIVERED, RETURNED/LOST/DAMAGED); `Package`
  +currentBranchId/availableAt/deliveredAt/currentQuoteId; `PackageQuote`
  (snapshot inmutable); `CustomerAuthChallenge` (OTP del portal);
  `CounterVisit`; `DispatchTicketPackage`→FK real a `Package`;
  `SaleOrderLine`+packageQuoteId. Migración `20260908120000_portal_counter_lifecycle`.
- **Máquina de estados (`19faa10`)** — `cargo/domain/package-status` recorrido
  completo + efectos de proyección; `cargo/application+infrastructure`
  `advancePackage` (valida, actualiza proyección, timeline + outbox);
  `POST /api/packages/:id/advance` — puente manual, guard `package.status.override`.
- **Portal (`90c86fa`)** — U.0: `modules/portal` (challenge 6 díg/10 min/5
  intentos hasheado; session `__Host-cargo_portal_session` revocable; magic-link
  HMAC 7 días; service con respuesta+latencia constantes y límite por casillero/IP;
  código a `CustomerNotification`). Rutas `/api/portal/auth/*` fuera del gate de
  staff. U.1: `/api/portal/{casillero,paquete/[codigo]}` scoped por sesión, sin
  PII; pantallas `/portal/*` móvil-primero + `<EstadoPaquete>` + timeline.
- **Mostrador + facturación (`6650789`)** — U.2: `counterSearch` (casillero /
  tracking / nombre por forma — buscar por nombre acá SÍ va), casillero view
  multi-select, `CounterVisit` recientes, `counterHandover` (DispatchTicket +
  AVAILABLE→DELIVERED, registra quién retira, `allowUnpaid` con crédito).
  U.3: `contexts/billing` — `buildFreightInvoice` puro; `billFreightForPickup`
  congela un `PackageQuote` por paquete; `getFreightInvoice` lee del snapshot,
  nunca del `RateCard` vigente. Cobrar → `assertCanCollectPayment` (409 sin caja).
  `/app/branch/dispatch` deja de ser RouteShell.
- **Tableros + cierre de día + nav (`9be3251`)** — U.4:
  `masterLogisticsOverview` / `branchLogisticsOverview` + `<LogisticsOverview*>`
  arriba del Centro de Comando y del panel del día. `confirmOperationalDay`: no
  cierra limpio con retiros sin cobro/crédito ni entregas sin evidencia (ítems
  de atención). U.5: `NavItem.href: Route` (typedRoutes ⇒ href muerto no compila).
- **Tests (`4797878`)** — 36 puros: challenge, magic-link, freight-invoice,
  package-status, advance-package, query-shape del mostrador.
- **Seed (`…`)** — NIC-00002 + 7 paquetes demo por el recorrido.

**Verde:** cargo-api tsc + 697 tests + arch:check (484 módulos) + migración;
cargo-frontend tsc + lint + `next build` + unit + logic.

**Fuera de alcance / diferido:** canal real de WhatsApp/SMS (código queda en
`CustomerNotification`); registro de clientes en el portal (lo crea BM CARGO);
estimados de llegada (sin histórico por lane); consolidación/embarque/aduana/
distribución reales (transición manual entretanto); firma real en la entrega
(campo `signatureUrl` listo, captura no).
