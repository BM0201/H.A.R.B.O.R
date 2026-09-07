# HARBOR — PASO S: Receiving, escáner y match de pre-alerta

> **Prompt de implementación.** Primer vertical slice del §12 paso 9.
> Rama nueva. Requiere el PASO R ejecutado (roles, RBAC consolidado, cascarón de
> rutas), porque `warehouse.receive` y `package.measure` viven ahí.
> Este paso **sí** crea el agregado `Package`, acotado al camino de recepción.

---

## Insumo de dominio capturado

De la operación real de BM CARGO, confirmado por el dueño:

**Rotulado.** El cliente rotula al comprar. Misma dirección física para ambas
modalidades; lo que cambia es el prefijo del nombre del destinatario:

```
Nombre:    AirBmCargo <Nombre> <Apellido>     → aérea
Nombre:    MarBmCargo <Nombre> <Apellido>     → marítima
Dirección: 7792 NW 71st ST
Ciudad:    Doral, Florida 33166
```

El prefijo es vinculante: la modalidad se decide en la compra, no en la
consolidación.

**Pre-alerta.** Hoy por WhatsApp: captura de la compra donde se vea la dirección
con sus datos, más el tracking en texto cuando lo tiene.

**Tarifas.** $6.00/lb aérea, $2.50/lb marítima, más tarifas especiales por
cliente. Las configura `OWNER` o `BRANCH_ADMIN`.

**Pesaje.** Bodega origen pesa. **Aduana vuelve a pesar.** Son dos mediciones
distintas del mismo paquete.

---

## Decisiones pendientes que bloquean parte de este paso

Registrar la respuesta en PRODUCT.md antes de implementar lo que dependa de
ellas.

### D-1. Peso volumétrico

¿Se cobra sobre peso real o sobre `max(peso real, peso volumétrico)`?

A $6/lb aéreo, una caja de 60×50×40 cm con 4 lb reales paga $24 y ocupa el
espacio de unas 30 lb. Sin volumétrico, cada caja grande y liviana pierde plata.

**Impacto:** si aplica, la recepción **debe** capturar largo, ancho y alto, y el
escáner necesita el flujo de medición además del de pesaje. Si no aplica, el
campo se captura igual pero no entra en el cálculo.

*Mientras no se decida:* capturar dimensiones siempre (son baratas de tomar y
caras de recuperar después), y calcular sobre peso real.

### D-2. Discrepancia entre los dos pesajes

Bodega pesa 4.0 lb. Aduana pesa 4.8 lb. ¿Cuál factura?

Opciones: gana origen (lo cotizado al cliente es lo que paga) · gana aduana
(el peso real de despacho) · gana el mayor · o hay un umbral de tolerancia y
más allá se abre reclamo.

**Impacto:** define si existe re-facturación después de la cotización inicial, y
si el cliente puede ver un monto que después cambia. Es la fuente número uno de
disputas en este negocio.

*Mientras no se decida:* guardar ambos pesos, facturar sobre el de origen, y
marcar el paquete cuando la diferencia supere 5%.

---

## S.1 — Agregado `Package`, alcance de recepción

Solo lo que el camino de recepción necesita. Los campos de consolidación,
embarque y entrega llegan en sus pasos.

```prisma
enum TransportMode {
  AIR
  SEA
}

enum PackageStatus {
  PRE_ALERTED       /// el cliente avisó, aún no llega
  RECEIVED_ORIGIN   /// recibido y pesado en Doral
  ORPHAN            /// llegó sin pre-alerta que lo reclame
  // el resto del recorrido llega en pasos posteriores
}

model Package {
  id            String   @id @default(cuid())
  /// Identificador público, no enumerable (E.1 del PASO 8).
  /// Alfabeto sin caracteres ambiguos, 6+ caracteres.
  trackingCode  String   @unique
  customerId    String?  /// null mientras es ORPHAN
  status        PackageStatus
  mode          TransportMode

  /// Tracking del carrier de origen. LA LLAVE DEL MATCH.
  originCarrier        String?
  originTrackingNumber String?  @unique

  /// Lo que se leyó en la etiqueta, tal cual. Sin normalizar.
  labelRecipientRaw    String?

  // — medición en origen —
  weightOriginLb  Decimal?
  lengthIn        Decimal?
  widthIn         Decimal?
  heightIn        Decimal?
  volumetricLb    Decimal?   /// calculado, D-1
  chargeableLb    Decimal?   /// el que factura, D-1

  // — medición en aduana (D-2) —
  weightCustomsLb Decimal?
  weightVariance  Decimal?   /// (customs - origin) / origin

  declaredValue   Decimal?
  receivedAt      DateTime?
  receivedByUserId String?
  locationId      String?

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([customerId, status])
  @@index([status, locationId])
  @@index([originTrackingNumber])
}

model PreAlert {
  id            String   @id @default(cuid())
  customerId    String
  mode          TransportMode   /// declarada por el cliente
  originCarrier String?
  originTrackingNumber String
  declaredValue Decimal?
  description   String?
  /// Captura de compra que el cliente envía. Bucket privado, URL firmada.
  proofUrl      String?
  matchedAt     DateTime?
  packageId     String?  @unique
  createdAt     DateTime @default(now())

  @@unique([customerId, originTrackingNumber])
  @@index([originTrackingNumber, matchedAt])
}
```

`originTrackingNumber` es `@unique` en `Package` a propósito: dos paquetes no
pueden reclamar el mismo tracking. La base lo impide, no el código.

Toda transición escribe `CargoTimelineEntry` en la misma transacción (ADR-0005)
y `OutboxEvent` (ADR-0006).

---

## S.2 — El match

### La llave es el tracking, no el nombre

El número de casillero **no está en la etiqueta** y no puede estarlo: el cliente
escribe el nombre del destinatario en el formulario de la tienda y no controla
lo que Amazon o Walmart imprimen.

Lo que sí está impreso, y como código de barras, es el tracking del carrier. Y
el cliente ya lo envía en la pre-alerta.

**Match por nombre está prohibido.** Dos clientes con el mismo nombre, OCR que
lee `BayarcloMendoza`, tildes, orden de apellidos, nombres compuestos: un match
errado manda el paquete de alguien al casillero de un extraño **y le cobra el
flete**. Falla en silencio y se descubre cuando alguien reclama.

El nombre corrobora. Nunca decide.

### Algoritmo

```
1. Escanear el código de barras del carrier → cadena cruda

2. Normalizar el tracking.
   Los carriers embeben el tracking en códigos más largos:
   - USPS IMpb: extraer los 22 dígitos del tracking
   - UPS: patrón 1Z + 16
   - FedEx: 12, 15 o 20 dígitos según servicio
   - Amazon Logistics: TBA + 12
   Guardar cruda y normalizada. La normalización es una función pura, testeable
   sin base de datos.

3. Buscar PreAlert abierta con ese originTrackingNumber normalizado.

   3a. MATCH ÚNICO
       → asignar customerId
       → status = RECEIVED_ORIGIN
       → continuar a pesaje (S.3)

   3b. MATCH ÚNICO, PERO LA MODALIDAD NO COINCIDE
       (pre-alerta dice AIR, etiqueta dice MarBmCargo, o al revés)
       → NO auto-asignar. A revisión humana.
       Es señal de que el cliente cotizó una cosa y rotuló otra: el precio
       cambia de $6 a $2.50 por libra o al revés.

   3c. SIN MATCH
       → status = ORPHAN
       → OCR de la línea de destinatario para PRE-LLENAR, no para asignar
       → parsear prefijo Air|Mar → modalidad sugerida
       → parsear nombre → lista de clientes candidatos, ordenada
       → un humano confirma. La confirmación queda auditada con quién y cuándo.

   3d. MÚLTIPLES MATCHES
       Imposible por el @unique, pero si ocurre: error duro, nunca elegir uno.
```

### Regla de confianza

| Tecnología | Lee | Puede auto-asignar |
|---|---|---|
| Código de barras del carrier | Tracking | **Sí** |
| OCR de la etiqueta | Nombre, prefijo Air/Mar, tienda | **No.** Solo pre-llena |
| Fotografía | Evidencia (§7) | **No.** Es prueba |

Un código de barras mal leído no valida y falla ruidosamente. Un nombre mal
leído se parece a otro y falla callado. Por eso solo uno de los tres asigna.

### Huérfanos

`ORPHAN` no es un error: es un estado normal del negocio. Llegan paquetes de
clientes que no pre-alertaron. Necesita:

- bandeja de trabajo propia, con antigüedad visible
- búsqueda por nombre parcial contra clientes activos
- asignación manual auditada
- política de qué pasa si nadie lo reclama (bloqueante abierto: sin definir)

---

## S.3 — Pesaje y cotización

### Captura

`package.measure`, concedida solo a `WAREHOUSE_ORIGIN` (y a
`OWNER`/`MASTER`/`SYSTEM_ADMIN`). **Negada explícitamente** a
`WAREHOUSE_DESTINATION` y `COURIER`.

Quien pesa determina cuánto se le cobra al cliente. Quien entrega no puede
tocar ese número. La corrección posterior exige
`package.measure.correct`, que solo tienen los roles superiores, y abre
`ApprovalRequest`.

**Origen del peso.** Escanear no pesa. Si el operador tipea el número, la
frontera antifraude descansa entera en la auditoría y el arqueo. Con báscula
conectada, el número tiene procedencia verificable. Registrar en
`CargoTimelineEntry` **cuál de los dos fue**, para que una auditoría futura
pueda distinguirlos.

### Tarifario

```prisma
model RateCard {
  id            String   @id @default(cuid())
  name          String
  mode          TransportMode
  pricePerLb    Decimal              /// 6.00 aérea · 2.50 marítima
  minimumCharge Decimal  @default(0)
  volumetricDivisor Decimal?         /// null = sin volumétrico (D-1)
  currency      CurrencyCode @default(USD)
  isActive      Boolean  @default(true)
  effectiveFrom DateTime
  effectiveTo   DateTime?
  /// null = tarifa general. Con valor = tarifa especial de ese cliente.
  customerId    String?
  createdByUserId String
  // ...
  @@index([mode, isActive, effectiveFrom])
  @@index([customerId, mode, isActive])
}
```

Resolución: tarifa especial del cliente vigente → tarifa general vigente de la
modalidad. Sin tarifa aplicable, **error explícito**. Nunca cobrar 0.

Editar tarifas exige `rate.edit`, solo `OWNER` / `BRANCH_ADMIN` / roles
superiores. Todo cambio queda en `AuditLog` con el valor anterior: es el número
que multiplica cada factura.

**El cálculo es una función pura**, sin base de datos:

```
volumetricLb = divisor ? (L × W × H) / divisor : 0
chargeableLb = max(weightOriginLb, volumetricLb)
subtotal     = max(chargeableLb × pricePerLb, minimumCharge)
```

Suite de tabla con al menos 12 casos: peso real gana, volumétrico gana, empate,
bajo el mínimo, tarifa especial vigente, tarifa especial vencida, sin tarifa
aplicable (debe lanzar), divisor null.

---

## S.4 — Notificación

Primer consumidor real del outbox. ADR-0006 difirió el despachador por falta de
consumidores; este es el consumidor. **Ahora se construye.**

Evento `receiving.package_received.v1`. Consumidor idempotente (la entrega es
at-least-once).

Lo que ve el cliente, según el ejemplo del dueño:

```
Tu paquete WASRXA está en bodega Doral.
Modalidad: Aérea · Peso: 4.0 lb · A pagar: $24.00
```

`WASRXA` es el `trackingCode` público **no enumerable** de E.1 — no un
correlativo. La vista pública no muestra nombre, dirección, teléfono ni valor
declarado.

---

## S.5 — Offline

La bodega es una nave metálica. El escaneo funciona sin red y sincroniza
después. HAMMER ya tiene el patrón (`offlineClientId`, `postedAt`,
`saleOccurredAt`) y se hereda bien.

**Pero offline no auto-asigna.** Sin red no se puede consultar pre-alertas ni
garantizar el `@unique` del tracking: dos dispositivos podrían asignar el mismo
paquete y ganaría el último en sincronizar.

Offline **encola**: captura tracking, peso, dimensiones y foto, y marca
`pendiente de match`. Al recuperar red, el match corre en servidor y aplica S.2
completo. El operador ve qué quedó pendiente.

---

## S.6 — Seguridad

**Dónde corre el OCR.** Las etiquetas llevan nombre y dirección completos. En el
dispositivo, la PII no sale de la bodega. En el servidor, cae bajo E.2 del
PASO 8: bucket privado, URLs firmadas con expiración corta, y `img-src` de la
CSP acotado al origen del storage — hoy es un comodín `https:`.

**Las capturas de compra de la pre-alerta** contienen dirección, medio de pago
parcial y detalle de compra. Mismo tratamiento: bucket privado, URL firmada por
request tras autorizar. Nunca ruta pública embebida en el HTML.

**Alcance del portal.** El cliente ve sus paquetes por el `customerId` de su
sesión. Nunca por un `customerId` del request.

---

## Tests

- [ ] Normalización de tracking: USPS IMpb, UPS 1Z, FedEx (12/15/20), Amazon TBA
- [ ] Match único auto-asigna y escribe timeline + outbox en una transacción
- [ ] Modalidad discrepante **no** auto-asigna, va a revisión
- [ ] Sin match → `ORPHAN`, y el OCR **no** asigna
- [ ] Nombre nunca asigna: test que lo intente y falle
- [ ] Dos paquetes con el mismo `originTrackingNumber` → violación de unicidad
- [ ] `WAREHOUSE_DESTINATION` y `COURIER` reciben 403 en escritura de peso
- [ ] Corrección de peso sin `package.measure.correct` → 403
- [ ] Corrección de peso con la capacidad → abre `ApprovalRequest`
- [ ] Cotización: 12 casos de tabla, incluido "sin tarifa aplicable lanza"
- [ ] Tarifa especial de cliente gana sobre la general
- [ ] Tarifa especial vencida cae a la general
- [ ] Cambio de tarifa queda en `AuditLog` con el valor anterior
- [ ] Offline encola sin asignar; al sincronizar corre el match completo
- [ ] Consumidor de notificación es idempotente ante entrega duplicada
- [ ] `trackingCode` público no es secuencial ni derivable del id
- [ ] Vista pública no expone nombre, dirección, teléfono ni valor declarado

---

## Plantillas de commit

```
feat(cargo): agregado Package acotado al camino de recepcion
feat(receiving): PreAlert y normalizacion de tracking de carrier
feat(receiving): match por tracking con verificacion cruzada de modalidad
feat(receiving): bandeja de huerfanos con asignacion manual auditada
feat(rating): RateCard por modalidad con tarifa especial por cliente
feat(receiving): captura de peso y dimensiones con guard de rol
feat(outbox): despachador y primer consumidor de notificacion
feat(receiving): captura offline en cola, match diferido al servidor
test(receiving): tabla de cotizacion y matriz de match
```

---

## Fuera de alcance

- Consolidación, embarque, aduana, distribución y entrega: sus propios pasos.
- Reconciliación de los dos pesajes: depende de **D-2**.
- Política de huérfanos no reclamados: bloqueante abierto.
- Ingesta automática desde WhatsApp: hoy la pre-alerta se carga a mano o por
  portal. Automatizarla es un paso propio y necesita decidir si BM CARGO usa la
  API de WhatsApp Business o sigue con carga manual.

---

## Registro de ejecución (2026-09-07)

Ejecutado en la rama `harbor-paso-s` (desde `harbor-paso-r`). Ver
`docs/EJECUCION-FASE-0-0A.md` § PASO S para el detalle por commit. Desviaciones
respecto de este prompt:

- **`PreAlert.proofUrl` → `proofKey`** y `Package` sin campo de URL pública: se
  guarda la clave del bucket privado, nunca una URL (S.6). Las URLs firmadas y
  el `img-src` de la CSP siguen pendientes (PASO 8 E.2).
- **`Package` + `originBranchId`, `weightSource`, `weightVarianceFlagged`,
  `quote*`** — campos operativos que el prompt no lista pero el flujo necesita
  (scope del guard, procedencia del peso, cotización calculada en recepción).
- **`package.measure` es `FRAUD_BOUNDARY_ONLY`** (decisión de PASO R.6): ni los
  roles globales lo heredan; solo `WAREHOUSE_ORIGIN`. Corrigen con
  `package.measure.correct`.
- **Despachador del outbox por cron de Vercel** (`/api/system/cron/outbox-dispatch`,
  cada 5 min) — no worker aparte ni LISTEN/NOTIFY.
- **Migración generada offline** con `prisma migrate diff` (no hay Postgres local);
  se aplica con `prisma migrate deploy`.
- **Portal del cliente**: no hay pantallas de portal todavía; el endpoint de
  lectura scoped por sesión se construye con el portal (Fase 2). Ninguna ruta de
  lectura acepta `customerId` del request.
