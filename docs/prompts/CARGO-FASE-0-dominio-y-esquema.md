# CARGO V1 — FASE 0: Dominio y Esquema Base

> **Prompt de implementación.** Fork de `BM0201/hammer-pos-production@Hammer-V1`.
> Renombrá `CARGO` al nombre real del sistema antes de ejecutar.

---

## Contexto para el implementador

Este repositorio es un fork de H.A.M.M.E.R., un POS/ERP de ferretería
(Next.js 15 + Prisma + PostgreSQL/Neon, tres workspaces: `hammer-api`,
`hammer-agent`, `hammer-frontend`).

Se está reconvirtiendo en un sistema de courier / carga aérea y marítima
(modelo casillero: el cliente compra en el exterior, el paquete llega a la
bodega de origen, se consolida, viaja, pasa aduana y se entrega).

**Regla arquitectónica que no se negocia:** un paquete NO es un `Product`.
`Product` es fungible (saldo por sucursal, costo promedio, fusión de empaques).
Un `Package` es una entidad serializada, única y con dueño. Modelar paquetes
como productos con cantidad 1 rompe el motor de inventario heredado. Se crea
tabla nueva y se elimina el motor de producto.

---

## Prerequisitos (bloqueantes)

Antes de la primera línea de código de esta fase:

- [ ] Fase 0 de la remediación de H.A.M.M.E.R. aplicada al fork
      (pipeline CI apuntando a ramas existentes, lista de tests
      descubierta por glob y no hardcodeada).
- [ ] Fase 1 de la remediación aplicada (guard de concurrencia de tesorería).
      El módulo de tesorería se hereda completo; el race condition se hereda
      con él.
- [ ] La Fase 2 (409 de producto fusionado HIERRO/QUINTAL) **NO** es
      prerequisito. El motor de fusión se elimina en el paso 0.2. Sigue siendo
      un bug vivo en `Hammer-V1` para la ferretería y debe arreglarse allá,
      pero no bloquea este trabajo.

---

## Orden de ejecución

Los pasos son secuenciales. No adelantar pasos.

### 0.1 — Fork y limpieza de identidad

1. Fork del repo, rama base `Hammer-V1`, rama de trabajo `cargo-v1`.
2. Renombrar workspaces: `hammer-api` → `cargo-api`, `hammer-frontend` →
   `cargo-frontend`, `hammer-agent` → `cargo-agent`.
3. Actualizar `package.json` (name, description), `vercel.json`,
   `.github/workflows/*`, `openapi.yaml`.
4. Base de datos nueva en Neon. **No** apuntar a la base de la ferretería
   en ningún momento, ni en desarrollo.

**Criterio de aceptación:** `npm run typecheck` y `npm test` pasan en los tres
workspaces contra la base nueva vacía. CI verde.

---

### 0.2 — Amputación del motor de producto

Eliminar del schema, de las rutas y del frontend:

**Modelos a eliminar**
```
Product, Category, BranchCategoryPricingPolicy, BranchProductSetting
ProductStockGroup, ProductStockGroupMember
InventoryBalance, InventoryConditionBalance, InventoryMovement
InventoryImportBatch, InventoryImportLine
ProductPricing, PricingConfig, ProductAnalytics
StockReorderPolicy, ReorderAlert, ReorderSuggestionBatch, ReorderSuggestionLine
ReplenishmentDraft, ReplenishmentDraftItem, ReplenishmentSignalSnapshot
ProductionRecipe, ProductionRecipeInput, ProductionBatch,
  ProductionBatchInput, ProductionPricingConfig
TimberProduct, TimberPricingConfig, TimberTrip, TimberTripLine
PurchaseOrder, PurchaseOrderLine
SaleReturn, SaleReturnItem, CreditNote, Refund, SaleCancellation
```

**Enums a eliminar**
```
InventoryMovementType, InventoryCondition, ReorderAlertType,
ReorderAlertStatus, ReorderSuggestionType, ReorderSuggestionStatus,
ReplenishmentDraft*, ProductionBatchStatus, TimberTripStatus,
PurchaseOrderStatus, SaleReturnStatus, SaleReturnType,
ReturnedItemCondition, ReturnInventoryDestination, RefundMethod,
RefundStatus, CreditNoteStatus, SaleCancellationStatus
```

**Rutas a eliminar**
```
/api/catalog/**            /api/inventory/**
/api/master/production/**  /api/master/reorder/**
/api/master/replenishment/**  /api/master/purchase-orders/**
/api/timber/**             /api/pricing/**
/api/purchase-orders/**    /api/suppliers/**
/api/sales/returns/**      /api/sales/cancellations/**
/api/analytics/classify    /api/master/catalog-inventory/**
/api/reports/inventory-critical  /api/reports/inventory-movements
```

**Componentes frontend a eliminar**
```
components/catalog/**  components/catalog-inventory/**
components/inventory/**  components/timber/**
```

**Conservar y reetiquetar:** `Supplier` se mantiene como tabla, se reetiqueta
a **Carrier** (naviera / aerolínea / consolidador de origen). Solo cambio de
nombre y campos; no se elimina.

**Criterio de aceptación:** `prisma validate` pasa; `npm run typecheck` pasa
sin referencias huérfanas; ninguna migración pendiente; CI verde.

---

### 0.3 — Núcleo del dominio: Cliente y Casillero

Extender `Customer`. **No** crear tabla nueva de cliente.

```prisma
model Customer {
  // — heredado, se conserva —
  id          String   @id @default(cuid())
  code        String   @unique   /// ← NÚMERO DE CASILLERO (ej. NIC-01234)
  legalName   String
  displayName String
  taxId       String?
  phone       String?
  email       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // — nuevo —
  whatsappPhone     String?
  preferredLanguage String   @default("es")
  tier              CustomerTier @default(BRONCE)
  tierReviewedAt    DateTime?
  defaultAddressId  String?  @unique

  // — se ELIMINA —
  // address String?   ← reemplazado por CustomerAddress[]

  addresses      CustomerAddress[]
  packages       Package[]
  preAlerts      PreAlert[]
  analytics      CustomerAnalytics[]
  creditProfiles CustomerCreditProfile[]   // heredado, se conserva
  creditScore    CustomerCreditScore?      // heredado, se conserva
  branchScopes   CustomerBranchScope[]     // heredado, se conserva
  shipments      Shipment[]

  @@index([tier])
}

enum CustomerTier {
  BRONCE
  PLATA
  ORO
  PLATINO
}

model CustomerAddress {
  id           String  @id @default(cuid())
  customerId   String
  label        String            /// "Casa", "Oficina"
  recipientName String
  phone        String
  department   String            /// Managua, Masaya, ...
  municipality String
  addressLine  String
  /// Referencia en lenguaje natural. Obligatoria en la práctica
  /// nicaragüense: "de la rotonda El Periodista 2c al sur, portón negro"
  reference    String?
  latitude     Decimal?
  longitude    Decimal?
  isActive     Boolean @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  customer Customer @relation(fields: [customerId], references: [id])

  @@index([customerId, isActive])
}
```

**Migración de datos:** el `address` heredado se migra a un
`CustomerAddress` con `label = "Principal"`, `addressLine` = valor viejo.
Si el fork arranca con base vacía, omitir el backfill.

**Criterio de aceptación:** crear un cliente vía API asigna `code` único con
formato de casillero; el cliente puede tener N direcciones; una es la default.

---

### 0.4 — Paquete y su máquina de estados

```prisma
enum PackageStatus {
  PRE_ALERTED     /// cliente avisó, aún no llega a bodega origen
  RECEIVED_ORIGIN /// recibido y pesado en bodega origen
  CONSOLIDATED    /// asignado a un Shipment
  IN_TRANSIT
  IN_CUSTOMS
  AVAILABLE       /// liberado, listo para retirar
  DELIVERED
  RETURNED
  LOST
  DAMAGED
}

enum TransportMode {
  AIR
  SEA
}

model Package {
  id              String   @id @default(cuid())
  trackingCode    String   @unique   /// tracking interno del sistema
  customerId      String
  status          PackageStatus @default(PRE_ALERTED)
  mode            TransportMode

  /// tracking del carrier de origen (Amazon, USPS, UPS, FedEx)
  originCarrier        String?
  originTrackingNumber String?

  // — medidas: base del cobro —
  weightLb        Decimal?
  lengthIn        Decimal?
  widthIn         Decimal?
  heightIn        Decimal?
  /// peso volumétrico calculado (L*W*H / divisor del tarifario)
  volumetricLb    Decimal?
  /// mayor entre weightLb y volumetricLb ← sobre esto se cobra
  chargeableLb    Decimal?
  /// metros cúbicos, para marítimo
  volumeCbm       Decimal?

  // — aduana —
  declaredValue   Decimal?
  declaredCurrency CurrencyCode @default(USD)   // enum heredado
  contentDescription String?
  tariffCode      String?

  // — costeo (llenado por el prorrateo del Shipment) —
  allocatedFreight   Decimal @default(0)
  allocatedCustoms   Decimal @default(0)
  allocatedHandling  Decimal @default(0)

  // — bodegaje —
  availableAt     DateTime?   /// arranca el reloj de días libres
  freeStorageDays Int      @default(0)
  storageCharge   Decimal  @default(0)

  currentBranchId String?
  shipmentId      String?
  preAlertId      String?  @unique
  receivedAt      DateTime?
  deliveredAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  customer      Customer  @relation(fields: [customerId], references: [id])
  currentBranch Branch?   @relation(fields: [currentBranchId], references: [id])
  shipment      Shipment? @relation(fields: [shipmentId], references: [id])
  preAlert      PreAlert? @relation(fields: [preAlertId], references: [id])
  items         PackageItem[]
  events        PackageEvent[]

  @@index([customerId, status])
  @@index([status, currentBranchId])
  @@index([shipmentId])
  @@index([originTrackingNumber])
}

/// Contenido declarado. Esto es "el pequeño inventario" a nivel de paquete.
model PackageItem {
  id          String  @id @default(cuid())
  packageId   String
  description String
  quantity    Int     @default(1)
  unitValue   Decimal
  tariffCode  String?

  package Package @relation(fields: [packageId], references: [id], onDelete: Cascade)

  @@index([packageId])
}

/// Bitácora inmutable de estados. Alimenta "Últimos Paquetes" y notificaciones.
model PackageEvent {
  id          String   @id @default(cuid())
  packageId   String
  fromStatus  PackageStatus?
  toStatus    PackageStatus
  branchId    String?
  userId      String?
  note        String?
  occurredAt  DateTime @default(now())

  package Package @relation(fields: [packageId], references: [id], onDelete: Cascade)
  branch  Branch? @relation(fields: [branchId], references: [id])
  user    User?   @relation(fields: [userId], references: [id])

  @@index([packageId, occurredAt])
}

model PreAlert {
  id              String   @id @default(cuid())
  customerId      String
  originCarrier   String
  originTrackingNumber String
  declaredValue   Decimal
  description     String
  expectedAt      DateTime?
  matchedAt       DateTime?
  createdAt       DateTime @default(now())

  customer Customer @relation(fields: [customerId], references: [id])
  package  Package?

  @@unique([customerId, originTrackingNumber])
  @@index([customerId, matchedAt])
}
```

**Transiciones válidas** (implementar como guard en servicio, no en la ruta):

```
PRE_ALERTED     → RECEIVED_ORIGIN | RETURNED
RECEIVED_ORIGIN → CONSOLIDATED | DAMAGED | LOST
CONSOLIDATED    → IN_TRANSIT | RECEIVED_ORIGIN (des-consolidar)
IN_TRANSIT      → IN_CUSTOMS | LOST
IN_CUSTOMS      → AVAILABLE | RETURNED | DAMAGED
AVAILABLE       → DELIVERED | RETURNED
DELIVERED       → (terminal)
```

Toda transición escribe un `PackageEvent`. Sin excepción.

**Criterio de aceptación:** test que recorra el camino feliz completo
`PRE_ALERTED → DELIVERED` y verifique 6 `PackageEvent`; test que rechace
cada transición inválida con 409 y mensaje explícito.

---

### 0.5 — Consolidado (reutilización de InternalFreightTrip)

Refactor de `InternalFreightRoute` / `InternalFreightTrip` /
`InternalFreightTripLine` a `Lane` / `Shipment` / `ShipmentLine`.

La lógica de prorrateo existente se **conserva**: reparte un costo total del
viaje sobre las líneas según `allocationMethod`. Cambian los métodos:

```prisma
enum AllocationMethod {
  BY_CHARGEABLE_WEIGHT   /// aéreo — default
  BY_VOLUME              /// marítimo — default
  BY_DECLARED_VALUE      /// para aduana ad valorem
  MANUAL
}
```

`Shipment` reemplaza los costos de camión por: `freightCost`,
`customsCost`, `handlingCost`, `otherCost`, `totalShipmentCost`, más
`masterAwb` (aéreo) o `billOfLading` (marítimo), `carrierId`, `mode`,
`etd`, `eta`.

`ShipmentLine` apunta a `packageId` en lugar de `productId`, y escribe
de vuelta en `Package.allocatedFreight` / `allocatedCustoms` /
`allocatedHandling` al pasar a estado `APPLIED`.

**Truck** se conserva sin cambios para la última milla local.

**Criterio de aceptación:** dado un `Shipment` con costo total conocido y
N paquetes con pesos distintos, `BY_CHARGEABLE_WEIGHT` reparte el 100% del
costo sin centavos perdidos (el residuo de redondeo va a la línea de mayor
peso). Test con 3 paquetes y un total que no divide exacto.

---

### 0.6 — Tarifario y peso volumétrico

Módulo nuevo. No hay nada heredado equivalente: el `PricingConfig` de la
ferretería es costo+margen y no aplica.

```prisma
model RateCard {
  id            String   @id @default(cuid())
  name          String
  mode          TransportMode
  currency      CurrencyCode  @default(USD)
  /// divisor de peso volumétrico: 166 aéreo estándar, 139 alternativo
  volumetricDivisor Decimal?
  minimumCharge Decimal  @default(0)
  isActive      Boolean  @default(true)
  effectiveFrom DateTime
  effectiveTo   DateTime?
  branchId      String?

  tiers RateCardTier[]
  branch Branch? @relation(fields: [branchId], references: [id])

  @@index([mode, isActive, effectiveFrom])
}

/// Escalones. Aéreo: rango de libras. Marítimo: rango de CBM.
model RateCardTier {
  id          String  @id @default(cuid())
  rateCardId  String
  fromUnit    Decimal
  toUnit      Decimal?     /// null = sin tope
  pricePerUnit Decimal
  flatFee     Decimal @default(0)

  rateCard RateCard @relation(fields: [rateCardId], references: [id], onDelete: Cascade)

  @@index([rateCardId, fromUnit])
}
```

**Cálculo (servicio puro, testeable sin base de datos):**

1. `volumetricLb = (L × W × H) / volumetricDivisor`
2. `chargeableLb = max(weightLb, volumetricLb)`
3. Ubicar escalón por `chargeableLb` (aéreo) o `volumeCbm` (marítimo)
4. `base = chargeableLb × pricePerUnit + flatFee`
5. `subtotal = max(base, minimumCharge)`
6. Aplicar beneficio de tier del cliente (paso 0.7)
7. Sumar `storageCharge` si `availableAt` excede días libres
8. Sumar impuestos de aduana sobre `declaredValue`

**Criterio de aceptación:** suite de tests de tabla con al menos 12 casos,
incluyendo: peso real gana, volumétrico gana, empate exacto, por debajo del
mínimo, justo en el borde de un escalón, y sin escalón aplicable (debe
lanzar error explícito, nunca cobrar 0).

---

### 0.7 — Analítica por cliente y motor de promociones

Aquí está el pedido de "sugerencias de descuentos, rotación de temporada y
perfiles inteligentes". **No** es un rename de `ProductAnalytics` — el cálculo
es distinto: la unidad de análisis pasa de producto a cliente.

```prisma
model CustomerAnalytics {
  id            String   @id @default(cuid())
  customerId    String
  month         DateTime          /// primer día del mes

  packageCount  Int
  totalChargeableLb Decimal
  totalVolumeCbm    Decimal
  totalBilled       Decimal
  totalPaid         Decimal

  /// RFM
  recencyDays   Int               /// días desde el último paquete
  frequency90d  Int               /// paquetes en ventana de 90 días
  monetary180d  Decimal           /// facturado en ventana de 180 días
  rfmSegment    String            /// "CAMPEON","LEAL","EN_RIESGO","DORMIDO","NUEVO"

  /// estacionalidad
  seasonalIndex Decimal           /// volumen del mes / promedio móvil 12m

  suggestedTier CustomerTier
  createdAt     DateTime @default(now())

  customer Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@unique([customerId, month])
  @@index([month])
  @@index([rfmSegment])
}
```

**Refactor de `Discount`:** eliminar `productIds`, `abcCategories`,
`xyzCategories`. Reemplazar por:

```prisma
  targetTiers    String?   /// "ORO,PLATINO" ← null = todos
  targetSegments String?   /// "EN_RIESGO,DORMIDO" ← null = todos
  targetMode     TransportMode?
  minPackages90d Int?
```

**Beneficios por tier** (tabla `TierBenefit`, configurable, no hardcodeada):
descuento en $/lb, días de bodegaje gratis adicionales, entrega a domicilio
incluida sí/no, prioridad en consolidado.

**Integración con el Decision Center heredado:** agregar
`BrainDecisionCategory.LOYALTY` y `BrainDecisionCategory.PRICING_CUSTOMER`.
El job mensual de analítica emite `BrainDecision` con `customerId` en
`sourceJson`, por ejemplo:

- cliente en `EN_RIESGO` con `monetary180d` alto → proponer descuento de reactivación
- cliente que cruzó el umbral de PLATINO → proponer ascenso de tier
- mes con `seasonalIndex > 1.4` recurrente → proponer promo anticipada

Esto reusa el flujo completo de aprobar/descartar/ejecutar que ya existe.
`BrainDecision` necesita una relación nueva `customerId` (hoy solo tiene
`productId`).

**Criterio de aceptación:** job mensual idempotente (correrlo dos veces no
duplica filas ni decisiones — usar el `fingerprint` único heredado); test de
segmentación RFM con dataset fijo de 20 clientes.

---

### 0.8 — Vista 360 del perfil

Endpoint `GET /api/customers/[id]/overview` que devuelve en una sola llamada:

```
perfil            → datos base + tier + direcciones
ultimosPaquetes   → Package, orden por receivedAt desc, limit 10
paquetesRetirados → Package status=DELIVERED, orden por deliveredAt desc, limit 10
enBodega          → Package status IN (AVAILABLE, IN_CUSTOMS, IN_TRANSIT)
                    con días transcurridos y bodegaje acumulado
contenidoDeclarado→ PackageItem agregados de los paquetes en bodega
analitica         → últimos 12 CustomerAnalytics + tier sugerido
sugerencias       → BrainDecision abiertas de este cliente
saldo             → CustomerCreditProfile + CustomerCreditScore (heredados)
```

Componente frontend `customer-360.tsx`, modelado sobre el `product-360.tsx`
existente (mismo patrón de tabs y drawer, reusar los primitivos de `ui/`).

**Criterio de aceptación:** una sola llamada, presupuesto de queries
declarado y verificado en test (máximo 8 queries); RBAC respetado — un
cajero de sucursal solo ve clientes dentro de su `CustomerBranchScope`.

---

## Fuera de alcance de Fase 0

Se planifican en Fase 1 y 2, no se implementan ahora:

- Notificaciones WhatsApp / SMS / email por cambio de estado
- Portal self-service del cliente (frontend público)
- Scraping o API de tracking de carriers de origen
- Cálculo automático de DAI / ISC / IVA por partida arancelaria
- App móvil de bodega para escaneo y pesaje
- Facturación electrónica DGI

---

## Plantillas de commit

```
feat(cargo): fork inicial desde Hammer-V1, renombre de workspaces
chore(cargo)!: elimina motor de producto, inventario y produccion
feat(customer): casillero, direcciones multiples y tiers
feat(package): entidad Package, PackageItem, PackageEvent y maquina de estados
refactor(shipment): InternalFreightTrip -> Shipment con prorrateo por peso facturable
feat(rating): tarifario, peso volumetrico y motor de cotizacion
feat(analytics): CustomerAnalytics RFM, estacionalidad y tiers
feat(brain): categoria LOYALTY y decisiones por cliente
feat(customer): endpoint y vista 360 del perfil
```

Cada paso es un commit. `BREAKING CHANGE:` en el cuerpo del commit de
amputación, listando los modelos eliminados.

---

## Definición de terminado para Fase 0

- [ ] `prisma validate` + `prisma migrate deploy` limpios contra base nueva
- [ ] `npm run typecheck` sin errores en los tres workspaces
- [ ] `npm test` verde, con los tests nuevos descubiertos por glob
- [ ] CI verde en la rama `cargo-v1`
- [ ] Seed que crea: 1 agencia origen, 1 agencia destino, 2 lanes (aéreo y
      marítimo), 2 tarifarios, 5 clientes con tiers distintos, 20 paquetes
      distribuidos en todos los estados
- [ ] `GET /api/customers/[id]/overview` responde completo sobre el seed
- [ ] Cero referencias a `Product`, `InventoryBalance` o `ProductAnalytics`
      en el árbol de código
