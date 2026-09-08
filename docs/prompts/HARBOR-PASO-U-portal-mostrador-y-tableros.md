# HARBOR — PASO U: Portal del cliente, mostrador y tableros logísticos

> **Prompt de implementación.** Convierte las pantallas heredadas de ferretería
> en pantallas de logística, y crea la superficie pública del casillero.
> Requiere PASO R (roles, RBAC, cascarón) y PASO S/T (Package, cotización).
> Escrito sobre `main` y los screenshots del sistema corriendo; la rama de
> Receiving no estaba disponible al redactarlo.

---

## Diagnóstico

La marca ya es HARBOR pero los tableros son los de la ferretería:

| Pantalla | Qué muestra hoy | Qué debería |
|---|---|---|
| Centro Master | Ventas globales C$0.00 · Cajas abiertas · Cobros del día | Paquetes por hub, peso pendiente, embarques en tránsito |
| Operación de sucursal | Punto de venta · Inventario crítico · Ventas del día | Paquetes disponibles para retiro, llegadas del día, entregas pendientes |
| Caja | Cobrar una venta | Buscar persona → ver su casillero → cobrar → entregar → facturar |

El dinero no desaparece de los tableros: sigue importando para saber el
movimiento del día. Deja de ser **la** métrica principal.

---

## U.0 — Decisión de seguridad que condiciona todo el portal

**El ID de casillero es un identificador, no una credencial.** `NIC-00001` está
impreso en etiquetas, se dicta a empleados de tienda, viaja por WhatsApp y es
secuencial.

### Decisión: casillero identifica, código de un solo uso autoriza

```
1. El cliente ingresa su número de casillero
2. Se envía un código de 6 dígitos al teléfono registrado del casillero
3. El código es de un solo uso, vence en 10 minutos, máximo 5 intentos
4. Se establece sesión de CustomerUser (cookie separada, ya ruteada en middleware.ts)
```

**Nunca revelar si el casillero existe.** Respuesta idéntica — "si el casillero
existe, enviamos un código" — con el mismo tiempo de respuesta. **Límite de tasa
por casillero y por IP.**

### Enlace directo

Para mandar "acá ves tu casillero" por WhatsApp: enlace **firmado con
vencimiento** (7 días), no una URL adivinable. Un enlace vencido lleva al
ingreso normal, no a un error.

### Lo que el portal nunca muestra

Ni el valor declarado, ni la dirección completa, ni el teléfono, ni datos de
otros paquetes del mismo consolidado. El cliente ve **sus** paquetes, resueltos
por el `customerId` de la sesión. Nunca por un `customerId` del request.

---

## U.1 — Portal del cliente

```
/portal                    ingreso por casillero
/portal/verificar          código de un solo uso
/portal/casillero          mis paquetes
/portal/paquete/[codigo]   detalle con la ruta
```

`/portal/casillero`: tres grupos — **Listos para retirar** (con sucursal y
monto), **En camino** (con etapa), **Entregados** (colapsados).

`/portal/paquete/[codigo]`: línea de tiempo vertical construida desde
`CargoTimelineEntry` (ADR-0005). Etapas cumplidas sólidas, la actual marcada,
las futuras en contorno. **Sin fechas estimadas inventadas.**

Diseño: registro **product**. Móvil primero, objetivos táctiles grandes, tema
claro.

---

## U.2 — Mostrador: entrega y cobro

Reemplaza `Punto de venta`. **Encontrar a la persona, ver su casillero, cobrar,
entregar y facturar.**

Búsqueda: un solo campo que acepta nombre / tracking del carrier / número de
casillero y resuelve por forma. Más **casilleros atendidos recientemente**.

**Buscar por nombre acá sí va, y no contradice el PASO S.** En Doral una máquina
asigna sin testigos y el nombre falla en silencio; en mostrador hay una persona
con cédula y el cajero confirma. El nombre **busca**; la entrega la confirma un
humano contra identificación.

Vista del casillero: DISPONIBLES EN ESTA SUCURSAL (selección múltiple, total
recalculado), EN CAMINO, ENTREGADOS.

**Cobrar y entregar son dos hechos.** No se implican. `payment.collect` exige
sesión de caja abierta (PASO R.3); `delivery.handover` es la entrega. Un paquete
puede entregarse sin cobro si el cliente tiene crédito, y puede pagarse sin
retirarse. Registrar en la entrega nombre y documento de quien retira.

---

## U.3 — Facturación

Se factura un **servicio de flete**:

```
Flete aéreo    4.0 lb × $6.00/lb      $24.00
Almacenaje     0 días                   $0.00
Cargo categoría                          $0.00
Total                                  $24.00
```

**Se lee de `PackageQuote` (PASO T.5), nunca del `RateCard` vigente.** Si el
dueño cambia $6 a $7 mañana, reimprimir una factura de hoy debe seguir diciendo
$6.

Conservar íntegra la infraestructura de facturación nicaragüense heredada
(`documentMode`, factura manual, orden de entrega, `manualInvoiceStatus`). Lo
que cambia es qué se factura, no cómo se numera. La línea de factura apunta a
paquetes, no a productos.

---

## U.4 — Tableros

### Centro Master

| Tarjeta | Métrica |
|---|---|
| Hub Doral | Paquetes en bodega · peso facturable acumulado · antigüedad del más viejo |
| En tránsito | Embarques en curso, por modalidad |
| En aduana | Paquetes detenidos y días detenidos |
| Listos para retiro | Por sucursal |
| Movimiento del día | Cobrado hoy — se conserva, deja de ser lo primero |
| Custodia sin confirmar | Saldos `CUSTODY` abiertos (PASO R.4) |

### Operación de sucursal

Llegadas del día · disponibles para retiro · entregas pendientes de última milla
· aprobaciones · cobros del día.

### Día operativo

El modelo heredado se conserva. Un día operativo de sucursal HARBOR no cierra
limpio si hay:

- retiros registrados sin cobro ni crédito asignado
- saldo `CUSTODY` sin confirmar a nombre de alguien de la sucursal (PASO R.4)
- paquetes marcados como entregados sin evidencia de entrega

---

## U.5 — Navegación

El sidebar todavía tiene íconos de ferretería. Derivarlo del catálogo de
capacidades (PASO R.1) y borrar lo que apunta a módulos eliminados.
Verificación: entrar con cada usuario demo y confirmar que la navegación solo
muestra lo que ese rol puede hacer.

---

## Tests

- [ ] Casillero inexistente y existente producen respuesta y latencia idénticas
- [ ] Código de un solo uso: no reutilizable, vence a los 10 min, 5 intentos máx
- [ ] Límite de tasa por casillero y por IP en la solicitud de código
- [ ] Enlace firmado vencido lleva al ingreso, no a error ni a acceso
- [ ] Sesión de cliente A no alcanza paquetes de B por ninguna vía
- [ ] Ninguna ruta del portal acepta `customerId` del request
- [ ] El portal no expone valor declarado, dirección ni teléfono
- [ ] `CustomerUser` recibe 403 en `/api/master/**` y `/api/treasury/**`
- [ ] Retiro multi-paquete calcula el total sobre lo seleccionado
- [ ] Entregar sin cobrar es posible con crédito; sin crédito, no
- [ ] Cobrar sin sesión de caja abierta → 409
- [ ] Reimprimir factura tras cambiar la tarifa mantiene el monto original
- [ ] Día operativo no cierra con retiros sin cobro ni con custodia pendiente
- [ ] Cada rol demo aterriza en su home y no ve navegación ajena

---

## Fuera de alcance

- **Canal real de WhatsApp/SMS**: el código se encola en `CustomerNotification`.
- **Registro de clientes en el portal**: el casillero lo crea BM CARGO en mostrador.
- **Estimados de llegada**: requieren histórico de tránsito por lane.
- **Últimas etapas del recorrido**: consolidación, embarque, aduana y
  distribución tienen sus propios pasos.

---

## Registro de ejecución (2026-09-08)

Rama `harbor-paso-u` desde `harbor-paso-s`. Ver `docs/EJECUCION-FASE-0-0A.md`
§ PASO U para el detalle por commit. Desviaciones:

- **PASO T no existe.** `PackageQuote` se crea en PASO U y se congela AL
  FACTURAR (`billFreightForPickup`); `getFreightInvoice` lee de ese snapshot +
  `SaleOrderLine`, nunca del `RateCard`. `Package.quote*` sigue siendo la
  cotización "vigente" que se recalcula al re-pesar.
- **Recorrido posterior a la recepción = transiciones MANUALES**
  (`POST /api/packages/:id/advance`, guard `package.status.override`). La lógica
  real de consolidación/embarque/aduana/distribución llega en sus pasos.
- **CSRF del portal**: las mutaciones del portal usan cookie `SameSite=strict` +
  límite de tasa; no el token CSRF de staff (que exige sesión de staff).
- **`CustomerUser` en `/api/master/**`**: el middleware de staff responde **401**
  (no 403) a una petición sin sesión de staff — semánticamente correcto, cumple
  "no alcanza".
- **Firma de la entrega**: el campo `DispatchTicket.signatureUrl` se guarda; la
  captura de firma en pantalla no se implementó.
- **U.5**: `NavItem.href` pasó a `Route` (typedRoutes bloquea hrefs muertos en
  compilación); la derivación total del `MASTER_NAV` desde el catálogo queda para
  la migración de RBAC a `contexts/identity-access/`.
