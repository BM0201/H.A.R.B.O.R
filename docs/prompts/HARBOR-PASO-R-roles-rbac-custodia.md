# HARBOR — PASO R (corregido): Roles, RBAC, custodia y cascarón de rutas

> **Prompt de implementación.** Reemplaza por completo el `PASO R` anterior,
> que tenía dos errores de fondo confirmados contra el repositorio.
> Rama nueva desde `main`. Toca schema (`RoleCode`), RBAC, tesorería y rutas.
> **No** crea el modelo `Package`: los pasos 2–6 del §12 siguen bloqueados.

---

## Correcciones respecto de la versión anterior

**El documento anterior decía que había dos catálogos RBAC. Hay tres, y el
limpio está muerto.** Verificado: `hasPermission` de `permissions.ts` se usa en
**0 rutas** — solo lo importa `guards.ts`, que nadie llama para autorizar.
`CAPABILITIES` de `policies.ts` está importado en **35 archivos de ruta** y
contiene **40 claves de ferretería** (`pos.sell`, `inventory.adjust`,
`production.recipes.manage`, `sale.return.*`, `transfers.dispatch`) para módulos
borrados en la Fase 0.2.

**El documento anterior proponía `CustodyTransfer` + `CustodyTransferStatus`.
Eso contradice una decisión escrita en el código.** `cash-monitor.ts`, sobre
`sendCashOutToCustody`, textual: *"'en tránsito' ya lo dice el saldo de la
cuenta CUSTODY — un campo de estado adicional sería un segundo lugar para que
ese mismo hecho se desincronice."* El modelo propuesto duplicaba exactamente el
hecho que el libro mayor ya lleva.

Ambas correcciones están incorporadas abajo.

---

## Orden de ejecución

```
R.0  guarda del seed          (bloqueante, va primero)
R.1  consolidación RBAC        (decide dónde viven las claves nuevas)
R.2  rol COURIER
R.3  cobro como capacidad
R.4  confirmCustodyReceipt
R.5  cascarón de rutas por rol
R.6  matriz semilla + medición
R.7  tests
```

R.1 va antes que R.2 y R.3 porque decide en qué catálogo aterrizan las claves
nuevas. Meterlas primero en el catálogo podrido y limpiarlo después es trabajo
doble.

---

## R.0 — Guarda del seed

`prisma/seed.ts` no verifica nada y crea siete usuarios con contraseña conocida.
Va primero porque el plan incluye bajar esa contraseña para desarrollo local.

**Anclar al host y puerto reales, no hacer substring.** Un patrón como
`/localhost|127\.0\.0\.1|\.local\b/` deja pasar
`db.staging.localhost.corp.com` y cualquier DSN de Neon con `.local` en el path.

```ts
const url = process.env.DATABASE_URL ?? "";
const LOCAL = /^postgres(ql)?:\/\/[^@]+@(127\.0\.0\.1|localhost):5433\/harbor_dev(\?|$)/;
const permitidoRemoto = process.env.ALLOW_REMOTE_SEED === "true";

if (process.env.NODE_ENV === "production") {
  console.error("seed.ts crea usuarios demo con contrasena conocida. Nunca en production.");
  process.exit(1);
}
if (!LOCAL.test(url) && !permitidoRemoto) {
  console.error(
    `Rechazado: DATABASE_URL no es la base local esperada.\n` +
    `Para sembrar otra base a proposito: ALLOW_REMOTE_SEED=true`
  );
  process.exit(1);
}
```

`NODE_ENV === "production"` aborta **sin escape**: `ALLOW_REMOTE_SEED` no lo
levanta. Nunca imprimir la `DATABASE_URL` en el mensaje de error — lleva
credenciales.

**Aceptación:** un DSN de Neon sale con código 1 sin escribir. `ALLOW_REMOTE_SEED=true`
lo permite. `NODE_ENV=production` aborta igual.

---

## R.1 — Consolidación de catálogos RBAC

### Decisión

**Sobrevive `policies.ts`. Se retira `permissions.ts`.**

Migrar 35 rutas más `guards.ts` a otro catálogo es un refactor grande, riesgoso
y sin valor para el usuario. Borrar 40 claves muertas de `policies.ts` es mucho
menos trabajo y llega al mismo lugar: un solo catálogo. Sobrevive el que carga
peso.

**Alcance, explícito.** Ambos viven en `src/modules/rbac/`, del lado heredado
del strangler (ADR-0007). La consolidación *real* es cuando RBAC migre a
`contexts/identity-access/`. Esto es limpieza y unificación, no rediseño — no
conviene hacer el refactor grande dos veces.

### Ejecución

1. **Mudar** las ~30 claves courier de `permissions.ts` a `policies.ts`
   (`package.measure`, `package.measure.correct`, `customer.create`,
   `shipment.cost.edit`, y las demás de la Fase 0.A).
2. **Borrar** de `policies.ts` las 40 claves de módulos eliminados:
   `pos.*`, `inventory.*`, `production.*`, `sale.return.*`, `transfers.*`,
   y las que apunten a catálogo, madera, compras y reabastecimiento.
3. **Podar `BRANCH_ADMIN`**, que hoy acumula ~90 capacidades casi todas muertas.
   Conceder lo que existe, no lo que existía.
4. **Eliminar** `permissions.ts` y `guards.ts::hasPermission`. Si `guards.ts`
   queda sin uso, eliminarlo también.
5. **Espejar** el resultado en `cargo-frontend/src/modules/rbac/policies.ts`,
   que ya diverge ~27 líneas.

### Test de paridad

Falla si los catálogos difieren. Va en CI, en el job de frontend, importando el
del backend:

```
- el conjunto de claves de CAPABILITIES es idéntico
- el conjunto de roles es idéntico
- para cada rol, el conjunto de capacidades es idéntico
```

**La regla que evita que vuelva a pasar:** la UI **oculta**, el servidor
**autoriza**. `policies.ts` en frontend existe para no mostrar botones muertos.
Toda ruta del backend revalida por su cuenta, aunque el botón esté escondido —
el bundle llega completo al navegador y sus reglas se leen ahí.

---

## R.2 — Rol `COURIER`

```prisma
  /// Última milla: entrega a domicilio con evidencia. Puede cobrar contra
  /// entrega, lo que lo convierte en portador de efectivo en tránsito (R.4).
  COURIER
```

Rol de sucursal, no global. Archivos a tocar **en el mismo commit**:

**Backend**
```
prisma/schema.prisma                      enum RoleCode
src/modules/users/validators.ts           z.enum de roleCode (2 ocurrencias)
src/modules/users/service.ts              BRANCH_MEMBERSHIP_ROLES
                                          mapa de configured.get(...)
src/modules/rbac/policies.ts              entrada COURIER en ROLE_CAPABILITIES
prisma/seed.ts                            usuario demo "repartidor"
```

**Frontend**
```
src/types/auth.ts                         union de RoleCode
src/modules/rbac/role-colors.ts           tratamiento visual
src/modules/rbac/role-routing.ts          resolveRoleHome (ver R.5)
src/modules/rbac/policies.ts              entrada COURIER
src/components/.../branches-admin.tsx     selector de rol
src/components/.../users-admin.tsx        presets de rol
src/app/app/system-admin/role-config/     página de configuración de roles
```

**Sobre los tests heredados.** Con el rol nuevo, `Record<RoleCode, …>` deja de
ser exhaustivo: `policies.test.ts` y `effective-permissions.test.ts` necesitan la
entrada `COURIER`. El criterio correcto es **"sin cambiar aserciones"**, no
"sin tocarse". Agregar la entrada es esperado; cambiar lo que una aserción
existente afirma, no.

---

## R.3 — Cobrar es una capacidad, no un rol

### Consolidar antes de agregar

Ya existen **cuatro** capacidades solapadas de cobro: `payment.collect`,
`payment.collect.direct`, `cash.payments.collect` y `cash.charge`. Sumar una
quinta empeora la pila.

**Consolidar las cuatro en `payment.collect`.** Migrar los consumidores, borrar
las otras tres. Si alguna distingue algo real (cobro directo vs. contra
documento), conservarla y documentar la diferencia en el catálogo; si no la
distingue nadie, muere.

### La regla

Cobrar exige **dos condiciones simultáneas**:

1. la capacidad `payment.collect` concedida al rol, y
2. una sesión de caja abierta y vinculada a ese usuario.

Con eso, `COUNTER`, `COURIER` y `CASHIER` pueden cobrar si la agencia se lo
concede, y ninguno puede cobrar sin gaveta abierta a su nombre. `CASHIER`
sobrevive para quien tenga caja dedicada y deja de ser obligatorio para las
agencias que no la tienen. **La pregunta organizativa deja de bloquear**: pasa a
ser configuración por sucursal en `BranchRoleConfig`, que ya existe.

Capacidades nuevas (al catálogo consolidado de R.1):

```ts
DELIVERY_HANDOVER: "delivery.handover",   // entrega en mostrador
DELIVERY_LASTMILE: "delivery.lastmile",   // entrega a domicilio
CUSTODY_HANDOFF:   "custody.handoff",     // entregar efectivo a otra persona
CUSTODY_RECEIVE:   "custody.receive",     // confirmar que lo recibió
```

El guard de `payment.collect` consulta la sesión de caja, no solo el rol. Sin
sesión abierta la respuesta es **409, no 403** — no es un problema de permiso,
es de estado, y el mensaje debe decir "abrí caja".

---

## R.4 — `confirmCustodyReceipt`

### Decisión

**Sin modelo nuevo, sin enum de estado.** El saldo de la cuenta `CUSTODY` ya
dice "en tránsito"; agregar un campo de estado sería el segundo lugar donde ese
hecho se desincroniza, que es exactamente lo que `cash-monitor.ts` decidió
evitar.

### El hueco real

`confirmBankDeposit` cubre *"fue al banco"*. No existe el caso *"se lo di a
Master en persona y lo confirmó"*. `sendCashOutToCustody` deja el dinero a
nombre de alguien y no hay otro lado.

**Por qué deja de ser deuda.** En la ferretería el efectivo en tránsito era
ocasional: alguien lleva el depósito al banco. Con cobro contra entrega a
domicilio hay efectivo en manos de repartidores **todos los días, por diseño**.
El ítem #1 de `PENDIENTES.md` pasa de deuda a prerrequisito del módulo de última
milla.

### Forma

`confirmCustodyReceipt`, espejando `confirmBankDeposit`:

- Crea la entrada `OUT` de la `CUSTODY` del portador y la contrapartida hacia el
  receptor, unidas por `cashMovementId`.
- Metadata de confirmación: quién confirmó, cuándo, monto confirmado.
- `confirmedAmount != amount` **no** se cierra: abre un `ApprovalRequest`
  (modelo existente) y el saldo queda sin cuadrar hasta que se resuelva.

### Reglas

- Quien entrega no puede confirmar su propia entrega: `fromUserId !=
  confirmedByUserId`, verificado en servicio, no solo en UI.
- **Un usuario con saldo `CUSTODY` ≠ 0 a su nombre no puede cerrar su jornada.**
  Es el control que hace que el efectivo vuelva, y es una consulta de saldo — no
  un join a una tabla de estados.
- El cierre de sucursal muestra los saldos `CUSTODY` abiertos. Una sucursal con
  custodia sin confirmar no cierra limpia.

### Diferido

La rendición del repartidor (declarar lo cobrado por entrega, distinguir
entregas sin cobro) depende del modelo de entrega, que depende de `Package`.
`confirmCustodyReceipt` **no** depende de eso: cierra un hueco que existe hoy.

---

## R.5 — Cascarón de rutas por rol

### El hallazgo

El árbol de `/app` es íntegramente el de la ferretería: `/app/branch` con caja,
dinero de la semana, operación del día; `/app/master` con empleados, gastos,
tesorería, cámaras. **No existe ninguna ruta de logística.**

Y `resolveRoleHome` no tiene caso para `COUNTER`, `WAREHOUSE_ORIGIN` ni
`WAREHOUSE_DESTINATION`: los tres caen al `return "/app/branch"` por defecto.
Entrar como bodega-origen aterriza en una página de sucursal con una caja
registradora.

Los roles no están desconectados de las rutas. **Las rutas no existen.**

### Qué sí se puede construir ahora

El cascarón: árbol de rutas por rol, con capacidad exigida y estado vacío que
declare qué va a vivir ahí y qué lo bloquea. No necesita `Package`.

Sirve para tres cosas: da un sistema navegable para mirar, vuelve el modelo de
roles concreto y testeable, y convierte el cascarón en documentación viva del
alcance.

```
/app/warehouse/receiving     recepción en origen      warehouse.receive
/app/warehouse/stock         paquetes en bodega       warehouse.view
/app/warehouse/consolidation consolidados             consolidation.manage
/app/shipments               embarques aéreo/marítimo shipment.view
/app/customs                 aduana                   customs.view
/app/branch/arrivals         llegada y distribución   arrival.receive
/app/branch/dispatch         entrega en mostrador     delivery.handover
/app/delivery                última milla             delivery.lastmile
/app/customers               casilleros               customer.view
/app/tracking                consulta transversal     tracking.view
```

### `resolveRoleHome` completo

```ts
SYSTEM_ADMIN          → /app/system-admin
OWNER                 → /app/owner
MASTER                → /app/master
ACCOUNTANT            → /app/master/finance
BRANCH_ADMIN          → /app/branch
COUNTER               → /app/branch/dispatch
CASHIER               → /app/branch/cash
WAREHOUSE_ORIGIN      → /app/warehouse/receiving
WAREHOUSE_DESTINATION → /app/branch/arrivals
COURIER               → /app/delivery
```

Ningún rol cae al `return` por defecto. El default se conserva solo como red
para roles desconocidos y debe registrar una advertencia.

### Contrato del estado vacío

Cada página del cascarón declara tres cosas, en este formato:

```
Recepción en origen
Aquí se registra la llegada de un paquete a la bodega de Miami: identificación
contra pre-alerta, pesaje, medición y fotografía.

Bloqueado por: modelo Package (§12 pasos 2-6).
Requiere: warehouse.receive
```

Nada de "Próximamente" ni spinners falsos. El estado vacío es documentación.

### Navegación derivada, no duplicada

El sidebar hoy tiene **30 `href` hardcodeados**. Las entradas se derivan del
catálogo de capacidades: si el usuario no tiene la capacidad, el ítem no se
renderiza. Un `href` nuevo sin capacidad asociada debe fallar el typecheck.

Borrar las entradas de módulos eliminados en la Fase 0.2 — hoy el sidebar
muestra una ferretería.

---

## R.6 — Matriz semilla

En `BranchRoleConfig`. Punto de partida configurable por sucursal, no constante
de código.

| Capacidad | SYS | OWN | MAS | B.ADM | COUNT | CASH | W.ORI | W.DES | COUR | ACC |
|---|---|---|---|---|---|---|---|---|---|---|
| `payment.collect` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| `custody.handoff` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — |
| `custody.receive` | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | — | — | — |
| `warehouse.receive` | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — |
| `consolidation.manage` | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — |
| `arrival.receive` | ✓ | ✓ | ✓ | ✓ | — | — | — | ✓ | — | — |
| `delivery.handover` | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — | — |
| `delivery.lastmile` | ✓ | ✓ | ✓ | ✓ | — | — | — | — | ✓ | — |
| `package.measure` | ✓ | ✓ | ✓ | — | — | — | ✓ | **—** | **—** | — |
| `package.measure.correct` | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| `shipment.cost.edit` | ✓ | ✓ | ✓ | — | — | — | — | — | — | ✓ |

`custody.receive` **no** va a `COUNTER` ni a `COURIER`: quien anda en la calle
con dinero no debería poder cerrar su propia cadena recibiendo la de otro.

`package.measure` ya existe en `permissions.ts` con `WAREHOUSE_ORIGIN` concedido
y `WAREHOUSE_DESTINATION` sin nada. Falta: el grant a `OWNER`/`SYSTEM_ADMIN`, la
negación explícita a `COURIER`, y el guard — bloqueado por `Package`. Dejar un
test `todo` que falle con mensaje explícito el día que `Package` exista sin su
guard.

---

## R.7 — Tests

- [ ] Seed contra DSN de Neon sale 1 sin escribir; `ALLOW_REMOTE_SEED=true` lo permite
- [ ] `NODE_ENV=production` aborta incluso con `ALLOW_REMOTE_SEED=true`
- [ ] Paridad de catálogos front/back: claves, roles y capacidades por rol
- [ ] Cero claves de módulos eliminados en el catálogo consolidado
- [ ] `CASHIER` recibe **403** en endpoint de bodega
- [ ] Con `payment.collect` y sin sesión de caja abierta: **409**
- [ ] `fromUserId` no puede confirmar su propia custodia
- [ ] Monto distinto genera `ApprovalRequest` y el saldo no cuadra
- [ ] Usuario con saldo `CUSTODY` ≠ 0 no cierra jornada
- [ ] `WAREHOUSE_DESTINATION` y `COURIER` no tienen `package.measure`
- [ ] Test `todo` del guard de peso, con mensaje que explique qué falta
- [ ] Cada uno de los 10 roles aterriza en su home; ninguno cae al default
- [ ] Ítem de sidebar sin capacidad asociada falla el typecheck
- [ ] Los 570 heredados verdes **sin cambiar aserciones** (agregar la entrada
      `COURIER` a los `Record<RoleCode, …>` es esperado)

---

## Plantillas de commit

```
fix(seed)!: aborta si DATABASE_URL no es la base local anclada
refactor(rbac)!: consolida en policies.ts, retira permissions.ts y guards
chore(rbac): elimina 40 capacidades de modulos borrados en Fase 0.2
test(rbac): paridad de catalogo entre front y back
feat(rbac): rol COURIER para ultima milla
refactor(rbac): consolida las 4 capacidades de cobro en payment.collect
feat(cash): cobrar exige sesion de caja abierta, 409 si no la hay
feat(treasury): confirmCustodyReceipt espejando confirmBankDeposit
feat(treasury): jornada no cierra con saldo CUSTODY a nombre del usuario
feat(routing): cascaron de rutas de logistica y home por rol
refactor(nav): sidebar derivado de capacidades, sin hrefs huerfanos
feat(rbac): matriz semilla en BranchRoleConfig
```

---

## Fuera de alcance

- **Rendición del repartidor** — espera a `Package`.
- **Guard de peso facturable** — espera a `Package`; queda el test que lo reclama.
- **Contenido de las páginas del cascarón** — espera a los pasos 2–6 del §12.
- **Migración de RBAC a `contexts/identity-access/`** — es la consolidación real;
  esto es la limpieza previa.
- **Bloqueante #3 (pago previo al embarque)**: si un paquete no puede viajar sin
  estar pagado, parte del cobro deja de ser posterior a la entrega y la rendición
  cambia de forma. Confirmarlo antes de construirla.
