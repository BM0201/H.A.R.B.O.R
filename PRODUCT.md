# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary — internal operations staff of BM CARGO, across two countries.**
They run the `/app` back-office and work at a counter or in a warehouse, usually
on a laptop or tablet in the 1024–1400px range, sometimes on a phone on the
warehouse floor.

- Recepción / bodega en origen (Miami hub): identifies the owner of an arriving
  package, weighs it, measures it, photographs it. **Sets the billable weight.**
- Coordinación de embarque: builds consolidations, assigns packages to an air or
  sea shipment, records AWB / bill of lading / container.
- Operación de arribo y bodega en Nicaragua: unloads, verifies, classifies,
  releases.
- Personal de sucursal: receives distribution, hands packages to customers at the
  counter.
- Repartidor: last-mile delivery with proof.
- Caja (CASHIER) y administración de sucursal (BRANCH_ADMIN).
- Contabilidad (ACCOUNTANT): shipment costs, reconciliation.
- Dirección (OWNER / MASTER): rates, exceptions, reports.
- SYSTEM_ADMIN: configuration and role setup.

**Secondary — end customers (Nicaraguan importers / online shoppers).**
They use the `/portal` self-service surface to register pre-alerts, follow every
package's status in real time, see what they owe, and manage delivery addresses.
Spanish-first, non-technical, often on a phone.

## Product Purpose

HARBOR is the operational system BM CARGO runs its courier business on. The model
is *casillero* (package forwarding): a customer in Nicaragua buys from US online
stores, has the package sent to BM CARGO's shared US warehouse address tagged
with their casillero number, and HARBOR tracks that package the whole way —
origin receipt → consolidation → air/sea shipment → customs → arrival in
Nicaragua → branch distribution → delivery — while computing the charge
(chargeable weight, volumetric weight, storage, customs, tier benefits) and
handling billing and reconciliation.

Success: every package has a single status that staff and the customer both
trust; the weight the customer is billed on is auditable and attributable; and
the money is reconciled at the end of every operational day.

## Positioning

- **The fraud boundary is a role, not a policy.** Whoever weighs and measures a
  package in origin (and therefore sets the billable weight) is structurally
  barred from being whoever hands it to the customer in destination —
  `WAREHOUSE_ORIGIN` and `WAREHOUSE_DESTINATION` are disjoint roles. Most courier
  software treats "warehouse" as one role.
- **The event log is the truth; status is a projection.** A package's status and
  current location are a synchronous projection of an immutable event log
  (ADR-0005). The timeline the customer sees and the current state can never
  disagree.
- **Built on a production-proven money core, not a greenfield MVP.** Treasury
  with cash-count, the operational day, the audit model, Nicaraguan payroll, and
  the customer credit / loyalty engine are inherited from a POS/ERP that ran a
  real business (H.A.M.M.E.R.); they are battle-tested, not rebuilt.
- **Nicaragua is the ground truth.** Natural-language address references ("de la
  rotonda El Periodista 2c al sur, portón negro"), córdoba/USD, DGI, Spanish, and
  tier-based benefits are core domain, not a localization layer.

## Operating Context

- **Two-country flow.** US origin warehouse (Miami hub) + Nicaragua destination
  (a central agency plus branches).
- **Casillero identification.** There is one shared physical US warehouse
  address. Each customer has a generated casillero number (their customer code,
  e.g. `NIC-00001`) that goes on the shipping label. Customers create pre-alerts
  by entering the origin store's tracking number against their casillero number;
  receiving staff match an arriving package to a casillero number, or resolve it
  as an orphan.
- **Package lifecycle.** `PRE_ALERTED → RECEIVED_ORIGIN → CONSOLIDATED →
  IN_TRANSIT → IN_CUSTOMS → AVAILABLE → DELIVERED`, plus `RETURNED / LOST /
  DAMAGED`. Every transition writes an event.
- **Charge model.** Chargeable weight = max(actual, volumetric); rate-card tiers
  by weight (air) or CBM (sea); the free-storage-days clock starts when a package
  becomes `AVAILABLE`; customs on declared value; customer tier
  (`BRONCE / PLATA / ORO / PLATINO`) benefits are configurable, not hardcoded.
- **Identifiers are handled constantly.** Casillero numbers, internal tracking
  codes, origin carrier tracking numbers, AWB / BL, and container numbers are
  read aloud, typed, and cross-checked all day, in both warehouses and at the
  counter.
- **Roles.** `SYSTEM_ADMIN, OWNER, MASTER, BRANCH_ADMIN, COUNTER, CASHIER,
  WAREHOUSE_ORIGIN, WAREHOUSE_DESTINATION, COURIER, ACCOUNTANT`.
- **Two densities.** Counter and office use want comfortable spacing; warehouse
  and high-volume list views want a compact mode.

## Capabilities and Constraints

**Confirmed:**

- Casillero model = one shared US warehouse address + a per-customer casillero
  number + customer-entered pre-alerts (origin tracking numbers) linked to that
  number. The customer is a single party; the "sender" is whatever store they
  bought from (captured as origin carrier + origin tracking number); the
  recipient is the customer or one of their Nicaragua addresses.
- Inherited and kept: auth / RBAC with per-location scoping, treasury + cash
  sessions + operational day, audit log, approvals workflow, Nicaraguan payroll,
  customer credit profile / score, the "Brain" Decision Center, operating
  expenses, and the ONVIF branch-camera agent (`cargo-agent`, untouched).
- Amputated: the ferretería product / inventory / catalog / production /
  purchasing engine. **A `Package` is not a `Product`** — a package is a unique,
  serialized, owned entity; modelling it as a fungible product breaks the
  inherited inventory engine, so that engine was removed.

**Terminology:** casillero (customer's mailbox/locker number), pre-alerta,
consolidado, Shipment (formerly Trip), Lane (formerly Route), *peso facturable* /
chargeable weight, *peso volumétrico*, AWB / BL, última milla, día operativo.

**Codebase:** a fork of H.A.M.M.E.R. Monorepo — `cargo-api` (Next.js 15 route
handlers + Prisma), `cargo-frontend` (Next.js 15 UI), `cargo-agent` (branch
camera agent). Workspace directory names keep the `cargo-` prefix for now.
PostgreSQL (Neon) in production; the real database will be a fresh Neon instance.
Strangler migration in progress: `src/contexts/**` (new hexagonal bounded
contexts) alongside a frozen `src/modules/**` (legacy, flat, direct Prisma).

**Open product decisions — do not invent these** (tracked in
`docs/ARQUITECTURA-HARBOR.md`):

- The exact orphan-package flow when a pre-alert cannot be matched.
- Whether a package can be shipped before it is paid for (makes billing a
  precondition of the core flow, or not).
- Customs scope: direct clearance vs external broker vs consolidated shipment
  with no per-package declaration.
- Whether HARBOR shares its user directory / auth with the H.A.M.M.E.R. POS or
  only shares conventions.
- Internal rack/bin warehouse locations; corporate (non-end-customer) cargo;
  abandoned-package / storage-charge policy.
- **D-1 — volumetric weight.** Is the customer billed on actual weight or on
  `max(actual, volumetric)`? At $6/lb air, a large light box loses money without
  a volumetric floor. *Interim, until the owner decides:* receiving **always**
  captures length/width/height (cheap to take, expensive to recover later) and
  the quote is computed on **actual weight only** — `RateCard.volumetricDivisor`
  is `null` on the seeded cards, which switches the volumetric term off in the
  pure calculation. Turning it on is a data change, not a code change.
- **D-2 — discrepancy between the two weighings.** Origin weighs 4.0 lb, customs
  re-weighs 4.8 lb — which one bills? *Interim, until the owner decides:* store
  **both** (`weightOriginLb`, `weightCustomsLb`), bill on **origin** (what was
  quoted to the customer), and set `weightVariance = (customs - origin) / origin`
  plus a flag on the package when it exceeds **5%**. No re-billing path is built
  yet; reconciliation waits on this decision.

## Brand Commitments

- Product name is **HARBOR**; the operating company is **BM CARGO**.
- No brand guide, logo, or palette has been provided. Decision this session: the
  inherited visual system may be **re-anchored** to a HARBOR identity, keeping
  its structure — role-color differentiation, verified WCAG AA contrast, the CSS
  token architecture, and two-density support.
- Voice: Spanish-first (`Customer.preferredLanguage` defaults to `"es"`);
  Nicaraguan operational vocabulary; plain language for non-technical counter and
  warehouse staff.
- Visible "HAMMER" / "H.A.M.M.E.R." strings are being replaced with "HARBOR".
  Heritage internal modules (`cash-session`, `finance`, `payroll`, `reports`,
  `brain`) keep their internal `hammer-*` identifiers (storage keys, class names,
  cache names) until a dedicated rename window; the cookie and workspace renames
  are also deferred to that window.

## Evidence on Hand

- **Domain specs (real):** `docs/prompts/CARGO-FASE-0-dominio-y-esquema.md`,
  `docs/prompts/CARGO-FASE-0A-amputacion-remodelado-y-roles.md`,
  `docs/prompts/HARBOR-fundacion-arquitectonica.md`;
  `docs/ARQUITECTURA-HARBOR.md` (ADR registry 0001–0006, actors, bounded-context
  map, hard blockers, delivery sequence); `docs/EJECUCION-FASE-0-0A.md`
  (execution record).
- **Working software:** login and the authenticated `/app` shell run locally
  against a seeded throwaway Postgres — agencia MIA "Miami Hub (origen)" + MGA
  "Managua Central (destino)", one demo staff user per role, demo customer
  `NIC-00001`.
- **Incumbent design system:** `cargo-frontend/src/app/globals.css`
  ("Design System v4"), hex color tokens, warm-stone neutrals, brand anchor
  `#D4380D`, five role-color ramps, a theme toggle, `tabular-nums` already used
  widely.
- **Absent — future work must not fabricate:** real customer data, a production
  database, brand assets, real rate cards, real carrier contracts, real customs
  tariffs, WhatsApp/SMS/email notification wiring, and the customer portal's
  screens (the `/portal` route is gated in middleware but has no pages yet).

## Product Principles

1. **One package, one authoritative status.** Status is a projection of an
   immutable event log; the timeline and the current state never disagree.
2. **The billable number is auditable and separated by duty.** Whoever sets a
   package's weight and dimensions in origin is never whoever hands it to the
   customer in destination.
3. **Identifiers are load-bearing.** Casillero numbers, tracking codes, AWB/BL
   and container numbers are read, spoken, and typed all day — the interface must
   make them unambiguous and hard to transcribe wrong.
4. **Inherit the money machinery; do not reinvent it.** Treasury, cash-count, the
   operational day, audit, payroll, and the loyalty engine stay authoritative.
5. **Nicaragua is the default case, not the edge case.** Natural-language
   addresses, córdoba/USD, DGI, Spanish, and tier benefits are core.

## Accessibility & Inclusion

- Keep the WCAG AA contrast floor already verified in the incumbent system
  (≥ 4.5:1 body text, ≥ 3:1 large text and UI).
- **Never encode a package status or an exception by color alone** — always color
  + icon + text label. Packages pass through many states, staff include
  colour-blind users, and warehouse screens are glare-prone.
- Disambiguated glyphs and tabular figures for all identifiers.
- Spanish-first; copy must stay legible for non-technical warehouse and counter
  staff.
