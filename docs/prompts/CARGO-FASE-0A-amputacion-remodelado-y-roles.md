# CARGO V1 — FASE 0.A: Amputación, Remodelado y Roles

> **Prompt de implementación.** Sustituye y detalla el paso 0.2 del documento
> `CARGO-FASE-0-dominio-y-esquema.md`. Ejecutar **después** de 0.1 (fork y
> renombre de workspaces) y **antes** de 0.3 (Cliente y Casillero).
>
> Renombrá `CARGO` al nombre real del sistema antes de ejecutar.

---

## Contexto para el implementador

Fork de H.A.M.M.E.R. (POS/ERP de ferretería: Next.js 15 + Prisma +
PostgreSQL/Neon; workspaces `cargo-api`, `cargo-agent`, `cargo-frontend`).
Se reconvierte en sistema de courier / carga aérea y marítima (modelo
casillero).

El schema heredado tiene **110 modelos y 67 enums**. Esta fase los reparte en
tres destinos y ejecuta cada uno. Al terminar, el schema debe quedar en
~76 modelos y ~42 enums, y `Package` todavía **no** existe (se crea en 0.4).

**Regla que no se negocia:** no se "adapta" ningún modelo de producto para que
sirva de paquete. Se borran y se crean tablas nuevas. Un `Product` es fungible
(saldo por sucursal, costo promedio, fusión de empaques); un paquete es
serializado, único y con dueño.

**Orden obligatorio:** A → B → C. El paso A rompe el typecheck a propósito; el
paso B lo repara. No intercalar.

---

## PASO A — Amputación

### A.1 Modelos a eliminar del schema (34)

```
# Catálogo y precios (8)
Category
BranchCategoryPricingPolicy
Product
ProductStockGroup
ProductStockGroupMember
BranchProductSetting
ProductPricing
PricingConfig

# Analítica de producto (1)
ProductAnalytics

# Inventario fungible (5)
InventoryBalance
InventoryConditionBalance
InventoryMovement
InventoryImportBatch
InventoryImportLine

# Reabastecimiento (7)
StockReorderPolicy
ReorderAlert
ReorderSuggestionBatch
ReorderSuggestionLine
ReplenishmentDraft
ReplenishmentDraftItem
ReplenishmentSignalSnapshot

# Producción (5)
ProductionRecipe
ProductionRecipeInput
ProductionBatch
ProductionBatchInput
ProductionPricingConfig

# Madera (4)
TimberProduct
TimberPricingConfig
TimberTrip
TimberTripLine

# Compras (2)
PurchaseOrder
PurchaseOrderLine

# Traslados — absorbidos por Shipment en 0.5 (2)
Transfer
TransferLine
```

**No borrar `Truck`.** Sobrevive para la última milla local.
**No borrar `Supplier`.** Se remodela a `Carrier` en el paso B.

### A.2 Enums a eliminar

```
InventoryMovementType      InventoryCondition
ReorderAlertType           ReorderAlertStatus
ReorderSuggestionType      ReorderSuggestionStatus
ReplenishmentDraftStatus   ReplenishmentDraftItemStatus
ReplenishmentDraftSource   ReplenishmentDraftCriticality
ProductionBatchStatus      TimberTripStatus
PurchaseOrderStatus        TransferStatus
SaleReturnStatus           SaleReturnType
ReturnedItemCondition      ReturnInventoryDestination
RefundMethod               RefundStatus
CreditNoteStatus           SaleCancellationStatus
```

`ProrationMethod` (`BY_QUANTITY`, `BY_VALUE`) **se conserva** — se amplía en 0.5.

### A.3 Relaciones huérfanas a limpiar

El borrado de `Product` rompe **25 relaciones entrantes**. Después de eliminar
los modelos de A.1, quedan referencias en modelos que **sobreviven** y hay que
limpiar a mano:

| Modelo que sobrevive | Campo a eliminar |
|---|---|
| `SaleOrderLine` | `productId`, `product` → se reemplaza en B.2 |
| `BrainDecision` | `productId`, `product` → se reemplaza por `customerId` en B.8 |
| `InternalFreightTripLine` | `productId`, `product` → se reemplaza por `packageId` en B.5 |
| `Branch` | `products`, `categories`, `inventoryBalances`, `transfers*`, `purchaseOrders`, y toda relación a modelos de A.1 |
| `User` | relaciones a `PurchaseOrder`, `Transfer`, `ProductionBatch`, `InventoryImportBatch`, `ReplenishmentDraft` |
| `Customer` | `saleReturns`, `refunds`, `creditNotes` → se reemplazan por `claims` en B.9 |
| `OperationalDay` | relaciones a `Transfer`, `ProductionBatch` |

Correr `npx prisma validate` tras cada bloque; el error señala la relación
huérfana exacta.

### A.4 Rutas a eliminar

```
/api/catalog/**                    /api/inventory/**
/api/pricing/**                    /api/purchase-orders/**
/api/suppliers/**                  ← se conserva, ver B.6
/api/timber/**                     /api/transfers/**
/api/master/production/**          /api/master/reorder/**
/api/master/replenishment/**       /api/master/purchase-orders/**
/api/master/catalog-inventory/**   /api/master/transfers/**
/api/master/pricing/**             /api/analytics/classify
/api/analytics/products            /api/sales/returns/**
/api/sales/cancellations/**        /api/reports/inventory-critical
/api/reports/inventory-movements   /api/reports/sales-by-category
/api/printing/purchase-orders      /api/printing/transfers
/api/ai-insights/discount-suggestions  ← se reescribe, ver B.7
```

### A.5 Componentes frontend a eliminar

```
src/components/catalog/**
src/components/catalog-inventory/**
src/components/inventory/**
src/components/timber/**
```

Limpiar las entradas correspondientes en `src/components/navigation/app-sidebar.tsx`
y en `src/modules/rbac/role-routing.ts`.

### Criterio de aceptación del paso A

- [ ] `npx prisma validate` pasa sin relaciones huérfanas
- [ ] `grep -rn "Product\|InventoryBalance\|ProductAnalytics" src/` en `cargo-api`
      devuelve **cero** resultados fuera de comentarios
- [ ] El typecheck **falla** con errores acotados a `SaleOrderLine`,
      `BrainDecision` e `InternalFreightTripLine`. Eso es esperado; lo repara B

---

## PASO B — Remodelado

19 modelos cambian de forma. Ejecutar en este orden.

### B.1 `Customer` → Cliente / Casillero

Ver paso 0.3 del documento base. Solo dos cosas aquí:
- eliminar el campo `address String?` (lo reemplaza `CustomerAddress` en 0.3)
- eliminar las relaciones `saleReturns`, `refunds`, `creditNotes`

Se **conservan intactos** `CustomerBranchScope`, `CustomerCreditProfile` y
`CustomerCreditScore`.

### B.2 `SaleOrder` / `SaleOrderLine` → Guía de flete

**Conservar sin tocar** toda la infraestructura de facturación nicaragüense —
es de las piezas más caras de reconstruir y aplica igual:

```
documentMode, requiresManualInvoice
deliveryOrderNumber, deliveryOrderIssuedAt, deliveryOrderPrintedAt
manualInvoiceSeries, manualInvoiceNumber, manualInvoiceDate,
manualInvoiceCustomerName, manualInvoiceCustomerRuc, manualInvoiceStatus,
manualInvoiceRegisteredById, manualInvoiceRegisteredAt, manualInvoiceNotes
saleOccurredAt, postedAt, syncedAt, offlineClientId
cancelledAt
```

**Cambios:**
- `SaleOrderLine.productId` → `packageId` (FK a `Package`, se conecta en 0.4)
- `SaleOrderLine`: eliminar `costSnapshot`, agregar `chargeableLb`,
  `rateCardTierId`, `freightAmount`, `customsAmount`, `storageAmount`
- `SaleOrder.customerId` pasa de opcional a **obligatorio** — no existe la
  venta de mostrador anónima; todo flete pertenece a un casillero
- `SaleOrderStatus`: eliminar `RETURN_REQUESTED`, `RETURN_APPROVED`,
  `RETURN_REJECTED`, `RETURNED`
- Eliminar relaciones `cancellations`, `replacementForCancellations`,
  `returns`, `creditNotes`; agregar `claims`

Renombrar el modelo a `Waybill` es opcional. Si se hace, hacerlo en este
commit y no después: renombrar un modelo con 12 índices más adelante es caro.

### B.3 `InternalFreightRoute` → `Lane`

```prisma
model Lane {
  id            String   @id @default(cuid())
  name          String
  mode          TransportMode          // creado en 0.4
  originBranchId      String?          // ← pasa a opcional
  destinationBranchId String?          // ← pasa a opcional
  originPortCode      String?          // MIA, IAH...
  destinationPortCode String?          // MGA, Corinto...
  transitDaysEstimate Int?
  defaultAllocationMethod AllocationMethod
  isActive      Boolean  @default(true)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  // ...
}
```

Eliminar `roundTripKm` (era para prorratear combustible de camión).

### B.4 `InternalFreightTrip` → `Shipment`

**Eliminar:** `fuelPricePerGallon`, `fuelCost`, `maintenanceCost`,
`driverCost`, `helperCost`, `truckId`, `transferId`.

**Agregar:** `carrierId`, `mode`, `masterAwb`, `billOfLading`, `containerNumber`,
`etd`, `eta`, `arrivedAt`, `freightCost`, `customsCost`, `handlingCost`,
`otherCost`.

**Conservar:** `totalShipmentCost` (antes `totalTripCost`), `allocationMethod`,
`status` (`DRAFT`/`CALCULATED`/`APPLIED`/`CANCELLED`).

### B.5 `InternalFreightTripLine` → `ShipmentLine`

**La lógica de prorrateo se conserva íntegra.** Es el activo más valioso que se
hereda: reparte un costo total sobre N líneas según un método. Solo cambia
la dimensión de reparto.

- `productId` → `packageId`
- `transferLineId` → eliminar
- `quantity` → `chargeableUnit` (libras facturables o CBM, según `mode`)
- `lineValue` → conservar (lo usa `BY_DECLARED_VALUE`)
- `allocatedFreight`, `allocatedFreightPerUnit` → conservar y agregar
  `allocatedCustoms`, `allocatedHandling`

Ampliar `ProrationMethod` (no crear enum nuevo):
```prisma
enum ProrationMethod {
  BY_QUANTITY            // heredado, se conserva
  BY_VALUE               // heredado, se conserva
  BY_CHARGEABLE_WEIGHT   // nuevo — default aéreo
  BY_VOLUME              // nuevo — default marítimo
  MANUAL                 // nuevo
}
```

### B.6 `Supplier` → `Carrier`

Rename del modelo y de la ruta `/api/suppliers` → `/api/carriers`.
Agregar `carrierType` (`AIRLINE` / `SHIPPING_LINE` / `CONSOLIDATOR` /
`CUSTOMS_BROKER` / `LAST_MILE`) y `scacCode`. El resto de campos de proveedor
(contacto, términos, cuenta bancaria) sirven tal cual.

### B.7 `Discount` → Promoción

**Eliminar:** `productIds`, `abcCategories`, `xyzCategories`.

**Agregar:**
```prisma
  targetTiers    String?         /// "ORO,PLATINO" ← null = todos
  targetSegments String?         /// "EN_RIESGO,DORMIDO" ← null = todos
  targetMode     TransportMode?
  minPackages90d Int?
  benefitScope   BenefitScope    /// FREIGHT | STORAGE | HOME_DELIVERY
```

**Conservar:** `type` (`PERCENTAGE`/`FIXED_AMOUNT`), `value`, `startDate`,
`endDate`, `active`, `branchId`, `createdByUserId`.

La ruta `/api/ai-insights/discount-suggestions` se reescribe en 0.7 para
alimentarse de `CustomerAnalytics` en vez de `ProductAnalytics`. Por ahora,
dejarla devolviendo lista vacía con un `TODO` explícito — no borrarla, porque
el frontend del Decision Center la consume.

### B.8 `BrainDecision`

- Eliminar `productId` y la relación `product`
- Agregar `customerId` + relación a `Customer`, con índice
- Agregar a `BrainDecisionCategory`: `LOYALTY`, `PRICING_CUSTOMER`, `CUSTOMS`,
  `STORAGE`
- Eliminar de `BrainDecisionCategory`: `INVENTORY`, `REORDER`, `PURCHASING`,
  `PRODUCTION`

**Conservar sin tocar:** `fingerprint` (@unique), `idempotencyKey`,
`BrainDecisionActionLog`, `BrainDecisionOutcome` y todo el flujo de
aprobar/descartar/ejecutar. Se reusa completo.

### B.9 Colapso de devoluciones → `Claim`

Cinco modelos (`SaleReturn`, `SaleReturnItem`, `Refund`, `CreditNote`,
`SaleCancellation`) se reemplazan por dos:

```prisma
enum ClaimType {
  DAMAGE            /// paquete dañado
  LOSS              /// paquete extraviado
  BILLING_ERROR     /// peso o tarifa mal calculada
  DELAY             /// incumplimiento de tránsito
  WRONG_DELIVERY
}

enum ClaimStatus {
  OPEN
  UNDER_REVIEW
  APPROVED
  REJECTED
  SETTLED
}

model Claim {
  id            String      @id @default(cuid())
  claimNumber   String      @unique
  customerId    String
  packageId     String?
  saleOrderId   String?
  branchId      String
  type          ClaimType
  status        ClaimStatus @default(OPEN)
  description   String
  claimedAmount Decimal?
  approvedAmount Decimal?
  /// Reembolso vía Payment negativo o nota de crédito manual.
  /// NO se reconstruye el motor de notas de crédito de la ferretería.
  settlementPaymentId String?
  openedByUserId   String
  resolvedByUserId String?
  openedAt      DateTime @default(now())
  resolvedAt    DateTime?
  // ...
}

model ClaimEvidence {
  id        String   @id @default(cuid())
  claimId   String
  fileUrl   String
  caption   String?
  uploadedByUserId String
  createdAt DateTime @default(now())
  // ...
}
```

**Conservar `CreditNote` no. Conservar el numerador sí:** la migración
`20260615000000_credit_note_numbering` tiene la lógica de numeración
secuencial con locking. Reusar ese patrón para `claimNumber`.

`ApprovalRequest` se conserva y gana `ApprovalType.CLAIM_SETTLEMENT`.

### B.10 `DispatchTicket` → Retiro

- `saleOrderId` pasa a opcional (se puede retirar sin guía pagada si hay crédito)
- Agregar tabla puente `DispatchTicketPackage` (`dispatchTicketId`, `packageId`)
  — un retiro cubre N paquetes
- Agregar `recipientName`, `recipientIdNumber`, `signatureUrl`
- `DispatchStatus` se conserva tal cual

### B.11 `TransportService` → Entrega a domicilio

- Agregar `addressId` (FK a `CustomerAddress`), `driverUserId`, `truckId`
- `customerName String` → reemplazar por `customerId` (FK real)
- `TransportServiceStatus` se conserva tal cual

### B.12 `BranchModuleConfig`

Eliminar nada. Agregar flags:
```prisma
  enableOriginWarehouse Boolean @default(false)
  enableCustoms         Boolean @default(false)
  enableHomeDelivery    Boolean @default(true)
  enableStorageFees     Boolean @default(true)
  enableCustomerPortal  Boolean @default(false)
```

### B.13 `OperatingExpense`

Solo cambia el enum:
```prisma
enum ExpenseCategory {
  PAYROLL      UTILITIES     RENT          FOOD
  MAINTENANCE  MARKETING     TAXES         OTHER
  // nuevos
  FREIGHT_PURCHASE   /// compra de capacidad al carrier
  CUSTOMS_FEES       /// agente aduanero, almacenaje portuario
  WAREHOUSE_ORIGIN   /// bodega en el exterior
  LAST_MILE
  // eliminado
  // TRANSPORT ← reemplazado por LAST_MILE
}
```

### Criterio de aceptación del paso B

- [ ] `npx prisma validate` y `npx prisma migrate dev` limpios
- [ ] `npm run typecheck` **verde** en los tres workspaces
- [ ] `npm test` verde (los tests de inventario/producción se eliminaron con
      sus módulos; los de tesorería, caja y nómina deben seguir pasando **sin
      modificarse** — si alguno requirió tocarse, se rompió algo que no debía)

---

## PASO C — Roles y permisos

### C.1 `RoleCode`

```prisma
enum RoleCode {
  SYSTEM_ADMIN
  OWNER
  MASTER
  BRANCH_ADMIN
  COUNTER                 // ← era SALES
  CASHIER
  WAREHOUSE_ORIGIN        // ← WAREHOUSE se parte en dos
  WAREHOUSE_DESTINATION   // ←
  ACCOUNTANT
}
```

**Por qué se parte `WAREHOUSE`.** No es cosmético. Bodega origen determina el
`chargeableLb`, o sea **define cuánto se le cobra al cliente**. Bodega destino
entrega el paquete. Si una sola persona puede alterar el peso facturable y
además entregar, se abre el hueco de fraude más obvio del negocio. Son roles
disjuntos con riesgo distinto y deben serlo en el schema, no solo en la UI.

**Regla derivada, implementar como guard:** `WAREHOUSE_DESTINATION` **nunca**
puede escribir `weightLb`, `lengthIn`, `widthIn`, `heightIn` ni `chargeableLb`.
Una corrección de peso post-consolidado exige `ApprovalRequest`.

Migración de datos: `SALES` → `COUNTER`, `WAREHOUSE` → `WAREHOUSE_ORIGIN` o
`WAREHOUSE_DESTINATION` según la sucursal. Si el fork arranca con base vacía,
omitir.

### C.2 Catálogo de permisos

Los strings de `UserPermission` heredados (`"production.recipes.view"`, etc.)
quedan huérfanos. Definir el catálogo nuevo en un módulo único
`src/modules/rbac/permissions.ts` exportado como const, y **derivar de ahí**
la validación — no strings sueltos regados en rutas.

```
customer.create        customer.view          customer.edit
customer.tier.override
package.receive        package.measure        package.measure.correct
package.consolidate    package.release        package.deliver
package.status.override
prealert.create        prealert.match
shipment.create        shipment.cost.edit     shipment.allocate
rate.view              rate.edit
customs.declare        customs.clear
claim.open             claim.resolve
promo.create           promo.approve
treasury.*             payroll.*              audit.*        (heredados)
```

### C.3 Matriz rol → permisos (semilla)

| Permiso | SYS | OWN | MAS | B.ADM | COUNT | CASH | W.ORI | W.DES | ACC |
|---|---|---|---|---|---|---|---|---|---|
| `customer.create` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| `customer.tier.override` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `package.receive` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| `package.measure` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | **✗** | ✗ |
| `package.measure.correct` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `package.consolidate` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✓ | ✗ |
| `package.release` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | ✗ |
| `package.deliver` | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✓ | ✗ |
| `shipment.cost.edit` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `rate.edit` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `claim.open` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ | ✗ |
| `claim.resolve` | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✓ |
| `promo.approve` | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

Sembrar en `BranchRoleConfig` (modelo heredado, se conserva).

### C.4 Separación del cliente externo

**El cliente NO va en `RoleCode` ni en `User`.** Decisión de seguridad, no de
estilo: la tabla `User` heredada está diseñada para personal interno con
alcance por sucursal (`UserBranchRole`), sesiones revocables, MFA y presencia.
Meter miles de clientes externos ahí significa que una escalación de permisos
en el portal público toca tesorería y nómina.

```prisma
model CustomerUser {
  id            String   @id @default(cuid())
  customerId    String   @unique
  email         String   @unique
  passwordHash  String
  emailVerifiedAt DateTime?
  lastLoginAt   DateTime?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id])
  sessions CustomerSession[]
}
```

- Cookie distinta, secreto de firma distinto, middleware distinto
- Sin `UserBranchRole`, sin `UserPermission`, sin `RoleCode`
- Alcance fijo y no negociable: solo sus propios `Package`, `PreAlert`,
  `SaleOrder` y `Claim`
- El portal se construye en Fase 2; el modelo se crea ahora para no tener que
  desmontar auth después

`middleware.ts` de `cargo-frontend` debe rutear `/portal/**` a la auth de
cliente y `/app/**` a la de staff, sin compartir un solo helper de sesión.

### Criterio de aceptación del paso C

- [ ] `permissions.ts` es la única fuente de strings de permiso; ningún literal
      suelto en rutas (verificable por lint rule o test de grep)
- [ ] Test: `WAREHOUSE_DESTINATION` recibe 403 al intentar `PATCH` de peso
- [ ] Test: `CustomerUser` no puede alcanzar ninguna ruta bajo `/api/master/**`
      ni `/api/treasury/**` — verificar con sesión válida de cliente, no solo
      sin sesión
- [ ] Seed crea un usuario por cada uno de los 9 roles y un `CustomerUser`

---

## Plantillas de commit

```
chore(cargo)!: elimina catalogo, inventario, produccion, madera y compras

BREAKING CHANGE: se eliminan 34 modelos y 22 enums del dominio de
ferreteria. Ver CARGO-FASE-0A seccion A.1 para la lista completa.

refactor(sales): SaleOrderLine apunta a paquete; conserva facturacion manual
refactor(shipment): Lane/Shipment/ShipmentLine con prorrateo por peso facturable
refactor(carrier): Supplier -> Carrier con tipo y codigo SCAC
refactor(promo): Discount deja de segmentar por producto y segmenta por cliente
refactor(brain): BrainDecision pasa de productId a customerId
feat(claims): colapsa devoluciones, notas de credito y anulaciones en Claim
refactor(dispatch): retiro multi-paquete con constancia de entrega
feat(rbac)!: parte WAREHOUSE en origen/destino, SALES -> COUNTER
feat(auth): CustomerUser separado del User interno
```

---

## Definición de terminado para Fase 0.A

- [ ] Schema en ~76 modelos y ~42 enums
- [ ] `prisma validate` + `migrate deploy` limpios contra base nueva
- [ ] `npm run typecheck` verde en los tres workspaces
- [ ] `npm test` verde; los tests heredados de tesorería, caja, día operativo
      y nómina pasan **sin haber sido modificados**
- [ ] CI verde en `cargo-v1`
- [ ] Cero ocurrencias de `Product`, `Inventory`, `Reorder`, `Replenishment`,
      `Production`, `Timber`, `PurchaseOrder` en `src/` de los tres workspaces
- [ ] `Package` **no** existe todavía — se crea en 0.4
