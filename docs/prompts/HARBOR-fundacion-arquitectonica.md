# HARBOR — Fundación Arquitectónica y Levantamiento de Dominio

**Producto:** HARBOR · **Empresa:** BM CARGO
**Etapa:** §12, pasos 1–6 (levantamiento, actores, procesos, dominio, bounded contexts)
**Estado:** ADR-0001 decidido. ADR-0002 a 0006 propuestos, pendientes de aprobación.
**No hay implementación en este documento. Es deliberado (§12).**

---

## Parte I — Decisiones de arquitectura (ADRs)

### ADR-0001 — Greenfield, no fork de HAMMER

**Estado:** ACEPTADO

**Contexto.** Existe un fork de HAMMER con el dominio de ferretería amputado.
El §3 exige que HARBOR no sea una copia de HAMMER y el §8 exige separación de
capas que HAMMER no tiene (Next.js App Router llamando Prisma directo desde
route handlers).

**Decisión.** Repositorio nuevo. HAMMER queda como **referencia de patrones**,
no como base de código. Ningún archivo se copia sin justificación explícita.

**Consecuencias.**
- El fork amputado pasa a ser material de consulta. No se desecha: la lista de
  34 modelos eliminados es conocimiento validado sobre qué **no** pertenece al
  dominio logístico.
- Se pierde el arranque rápido. Se gana no arrastrar la forma de `SaleOrder`,
  `DispatchTicket` y `Payment`, que fueron diseñados para vender mercadería de
  mostrador.
- Lo que sí se hereda deliberadamente son **patrones ya probados en producción**:
  el prorrateo de costo sobre N líneas, el día operativo, el cierre de caja con
  arqueo, y el modelo de auditoría. Se reimplementan, no se copian.

---

### ADR-0002 — Monolito modular, no microservicios

**Estado:** PROPUESTO

**Contexto.** §15 pide soportar crecimiento en volumen, sucursales, almacenes,
personal y rutas. Existe la tentación de leer "escalable" como "microservicios".

**Decisión.** Monolito modular con bounded contexts como módulos de frontera
explícita. Un solo deploy, una sola base de datos, un esquema por contexto.

**Justificación.** El crecimiento que describe el §15 es de **volumen y
alcance operativo**, no de equipos de desarrollo. Los microservicios resuelven
el problema de coordinar muchos equipos y pagan con complejidad distribuida:
transacciones repartidas, consistencia eventual, observabilidad compuesta.
BM CARGO no tiene ese problema y sí tiene el problema contrario — una
operación donde un paquete debe estar en un solo estado consistente.

Un monolito modular con fronteras bien puestas se puede partir después si hace
falta. Un microservicio mal cortado no se puede volver a pegar.

**Revisar esta decisión si:** aparece un equipo separado dedicado a un contexto,
o un contexto necesita escalar independientemente por carga real medida.

---

### ADR-0003 — Arquitectura hexagonal por módulo

**Estado:** PROPUESTO

**Decisión.** Cada bounded context se estructura en cuatro capas:

```
modules/<contexto>/
  domain/          entidades, value objects, eventos, reglas.
                   TypeScript puro. CERO imports de Prisma, Next, HTTP.
  application/     casos de uso. Orquesta el dominio. Depende de puertos
                   (interfaces), nunca de implementaciones.
  infrastructure/  repositorios Prisma, clientes externos, adaptadores.
                   Implementa los puertos.
  interfaces/      route handlers, DTOs, validación de entrada.
                   Capa delgada: traduce HTTP a caso de uso y vuelve.
```

**Regla de dependencia:** `interfaces → application → domain`.
`infrastructure → domain`. El dominio no apunta a nadie.

**Lo que hace que esto funcione o fracase.** La separación por carpetas no se
sostiene sola: en tres meses alguien importa Prisma en `domain/` bajo presión
de entrega y la arquitectura se erosiona en silencio.

Se **enforcea automáticamente** desde el primer commit, con
`dependency-cruiser` (o `eslint-plugin-boundaries`) corriendo en CI:

```
- domain/ no puede importar de application/, infrastructure/, interfaces/
- domain/ no puede importar @prisma/client, next/*, ni ningún paquete de I/O
- application/ no puede importar de infrastructure/ ni interfaces/
- un módulo no puede importar del interior de otro módulo:
  solo desde su índice público
```

Sin esta regla en CI, el ADR-0003 es decorativo.

---

### ADR-0004 — Stack: Next.js + Prisma + PostgreSQL

**Estado:** PROPUESTO

**Decisión.** Se conserva el stack de HAMMER (Next.js 15 App Router, Prisma,
PostgreSQL sobre Neon), pero con `interfaces/` como capa delgada sobre los
módulos, no como el lugar donde vive la lógica.

**Justificación.** La decisión del ADR-0001 ya es costosa. Sumar aprendizaje de
framework (NestJS y su DI, decoradores, módulos) encima de reescribir el dominio
desde cero es acumular dos riesgos donde solo hace falta uno. El §8 se cumple
con disciplina de capas y la regla del ADR-0003; no exige un framework
particular.

**Advertencia sobre Prisma.** El cliente de Prisma genera tipos que atan al
esquema de base de datos. Si esos tipos cruzan a `domain/`, la separación
desaparece aunque las carpetas se vean bien. El dominio define **sus propias**
entidades; `infrastructure/` mapea entre modelo Prisma y entidad de dominio.
Es trabajo extra, real, y es el precio del §8.

---

### ADR-0005 — El evento es la verdad; el estado es una proyección

**Estado:** PROPUESTO — **es la decisión de dominio más importante de HARBOR**

**Contexto.** El §6 lista 19 preguntas que el sistema debe poder responder sobre
cualquier paquete: cuándo, dónde, quién, con qué se consolidó, en qué embarque
viajó, cuándo salió, cuándo llegó, quién entregó. El §9 pregunta explícitamente
*"qué diferencia existe entre estado y evento"*.

**Decisión.** El historial de eventos del paquete es la fuente de verdad. El
estado actual (`status`, `currentLocationId`) es una **proyección
denormalizada** que existe por rendimiento de consulta, no por autoridad.

- Toda transición escribe un evento inmutable, en la misma transacción.
- Ningún camino de código actualiza el estado sin escribir el evento.
- El estado se puede reconstruir desde cero recorriendo los eventos.

**Por qué importa.** Las 19 preguntas del §6 no se responden con columnas en una
tabla de paquetes; se responden recorriendo un log. Si el estado es la verdad y
el evento es un log secundario "por si acaso", el log se desincroniza — siempre
lo hace — y la trazabilidad del §6 se vuelve mentira justo cuando más se
necesita: en una disputa por un paquete perdido.

**Alcance.** Esto **no** es event sourcing completo (sin reconstrucción de
agregados en memoria, sin CQRS obligatorio). Es un log de eventos autoritativo
con proyección de estado. Mucho más simple, y suficiente para el §6.

---

### ADR-0006 — Outbox transaccional para eventos de dominio

**Estado:** PROPUESTO

**Contexto.** §9 pregunta *"qué garantías de entrega necesitan"* los eventos.

**Decisión.** Los eventos se escriben en una tabla `outbox` dentro de la misma
transacción que el cambio de estado. Un despachador los publica después hacia
sus consumidores (notificaciones, proyecciones, integraciones).

**Justificación.** La alternativa — cambiar el estado y luego notificar — falla
en el hueco entre ambas operaciones. En logística ese hueco significa un cliente
que no recibió el aviso de que su paquete está listo, o un paquete liberado que
nunca se marcó como liberado.

**Consecuencia.** Entrega *at-least-once*. Todo consumidor debe ser idempotente.
Escribirlo en el contrato de eventos, no descubrirlo en producción.

---

## Parte II — Actores

Derivados del flujo del §5 y de la operación descrita en el §1.
**Los marcados con ⚠ requieren confirmación de BM CARGO.**

| Actor | Contexto principal | Responsabilidad crítica |
|---|---|---|
| Operador de recepción USA | Receiving | Identifica dueño, pesa, mide, fotografía |
| Supervisor de almacén USA | Warehouse | Ubicación, capacidad, corrección de medidas |
| Coordinador de embarque | Consolidation / Shipment | Arma consolidados, asigna a embarque |
| ⚠ Agente aduanero | Customs | ¿Interno o tercero con acceso al sistema? |
| Operador de arribo Nicaragua | Arrival | Descarga, verifica, clasifica |
| Personal de sucursal | Branches / Delivery | Recibe distribución, entrega en mostrador |
| Repartidor | Last Mile | Entrega a domicilio, evidencia |
| ⚠ Cajero | Billing | Cobra. ¿Existe caja física o el cobro es previo? |
| Administrador de sucursal | transversal | Supervisión local |
| Contabilidad | Billing | Costos de embarque, conciliación |
| Dirección | transversal | Reportes, tarifas, excepciones |
| ⚠ Cliente | portal | ¿Habrá autoservicio, o solo consulta interna? |

**Regla de separación heredada del análisis previo, y que el §11 respalda:**
quien determina el peso y las dimensiones (Receiving USA) **no** puede ser quien
entrega el paquete al cliente. El peso determina el cobro; entregar cierra la
operación. Concentrar ambas capacidades en un rol abre el hueco de fraude más
directo de este negocio. Debe ser una frontera de permisos, no una convención.

---

## Parte III — Bounded Contexts candidatos

Con nivel de confianza declarado. **No es la arquitectura definitiva** (§7).

| Contexto | Confianza | Nota |
|---|---|---|
| **Identity & Access** | Alta | Usuarios internos, roles, permisos por ubicación, auditoría |
| **Locations** | Alta | Almacenes, centros, sucursales. Ver advertencia abajo |
| **Customers** | Alta | Perfil, direcciones, contacto |
| **Cargo** | Alta | Paquete, medidas, valor declarado, evidencias |
| **Receiving** | Alta | Recepción e identificación en USA |
| **Warehouse** | Media | ¿Ubicaciones internas tipo rack/bin, o solo "está en Miami"? |
| **Consolidation** | Alta | Agrupación de paquetes |
| **Shipment** | Alta | Embarque aéreo/marítimo, contenedor, documentación |
| **Customs** | Baja | §7 dice explícitamente no asumir alcance |
| **Arrival** | Media | Se solapa con Warehouse y Shipment. Puede no ser contexto propio |
| **Distribution** | Media | Movimiento entre ubicaciones en Nicaragua |
| **Delivery** | Alta | Última milla, evidencia de entrega |
| **Tracking** | — | **No es un contexto.** Es una proyección de lectura sobre los eventos de todos los demás (ADR-0005) |
| **Billing** | Baja | §7: "el modelo financiero definitivo debe diseñarse posteriormente" |

### Advertencia sobre Locations

HAMMER tiene `Branch`: una entidad plana donde toda sucursal es igual. HARBOR
no puede heredar eso. Un almacén en Miami, un centro de procesamiento en
Managua y un local de entrega al público tienen capacidades disjuntas:

- solo Miami recibe de carriers externos y pesa
- solo el centro procesa arribo y aduana
- solo el local entrega al cliente final
- algunos almacenan; otros quizá no

Modelar esto como un `type` sobre una tabla plana lleva a `if (branch.type ===
...)` regado por todo el código. La alternativa es una entidad `Location` con
**capacidades explícitas** (`canReceiveFromCarrier`, `canWeigh`, `canStore`,
`canDeliverToCustomer`, `canProcessCustoms`), verificadas en la capa de
aplicación. Requiere confirmar la lista real de locales de BM CARGO antes de
cerrarla.

---

## Parte IV — Información faltante que bloquea el modelado

§13 exige indicarlo claramente. Estas no se asumen. Sin respuesta, el modelado
del dominio (§12 paso 5) no puede cerrarse.

### Bloqueantes duros

**1. Modelo de casillero.**
¿El cliente recibe una dirección propia en Estados Unidos y compra a su nombre,
o BM CARGO recibe carga de remitentes conocidos hacia destinatarios?
*Impacto:* decide si `Cliente`, `Remitente` y `Destinatario` (§7) son una parte
o tres. Cambia el agregado raíz de Cargo.

**2. Identificación en recepción.**
Llega una caja a Miami. ¿Cómo sabe el operador de quién es?
Opciones: número de casillero en la etiqueta / pre-alerta previa del cliente /
manifiesto del remitente / resolución manual.
*Impacto:* define si existe el contexto `PreAlert` y todo el flujo de paquetes
huérfanos.

**3. Momento del cobro.**
¿El paquete puede embarcarse sin estar pagado?
*Impacto:* si no puede, el pago es una precondición de transición de estado y
Billing deja de ser un contexto posterior — se vuelve bloqueante del flujo
central.

**4. Alcance de aduana.**
¿BM CARGO despacha directamente, usa agente aduanero externo, o consolida bajo
un régimen que evita declaración por paquete?
*Impacto:* §7 lo deja abierto y es la diferencia entre un contexto completo y
un par de campos de estado.

**5. Relación real con HAMMER.**
El documento describe a HAMMER como el sistema comercial de BM CARGO, pero el
repositorio auditado es un POS de ferretería (madera, quintales, fusión de
hierro). ¿Es la misma empresa?
*Impacto:* decide si HARBOR y HAMMER comparten directorio de usuarios y
autenticación, o solo comparten convenciones. Compartir identidad entre dos
empresas distintas sería un error de seguridad; entre la misma empresa, no
compartirla es fricción operativa diaria.

### No bloqueantes, pero necesarias antes de cerrar contextos

6. ¿Un paquete puede dividirse o agruparse físicamente en el camino?
7. ¿Existen ubicaciones internas dentro del almacén (rack, bin), o basta con
   saber en qué almacén está?
8. Lista real de locales de BM CARGO con sus capacidades.
9. ¿Hay carga que no sea de cliente final — corporativa, comercial, con reglas
   distintas?
10. ¿Qué pasa hoy con un paquete que nadie retira? ¿Existe cargo por almacenaje
    o abandono?

---

## Parte V — Secuencia propuesta

Siguiendo el §12. **No se escribe código de dominio hasta cerrar el paso 3.**

| # | Entregable | Depende de |
|---|---|---|
| 1 | Respuestas a los 5 bloqueantes | BM CARGO |
| 2 | Mapa de procesos: flujo real actual, no el ideal | (1) |
| 3 | Modelo de dominio: agregados, entidades, VOs, invariantes | (2) |
| 4 | Catálogo de eventos de dominio con payload y consumidores | (3) |
| 5 | Máquinas de estado por agregado, con transiciones prohibidas | (3) |
| 6 | Matriz de permisos por actor y ubicación | (3) |
| 7 | Esqueleto del monorepo + regla de dependencias en CI | ADR-0003 aprobado |
| 8 | Esquema de persistencia y mapeo dominio↔Prisma | (3) |
| 9 | Primer vertical slice: Receiving completo, de HTTP a base | (7)(8) |

El paso 7 es lo único que puede arrancar en paralelo, porque no depende del
dominio: es andamiaje, regla de capas y CI.

---

## Pendiente de decisión inmediata

- [ ] ADR-0002 — monolito modular
- [ ] ADR-0003 — hexagonal + enforcement en CI
- [ ] ADR-0004 — conservar stack Next.js/Prisma
- [ ] ADR-0005 — evento autoritativo, estado como proyección
- [ ] ADR-0006 — outbox transaccional
- [ ] Respuestas a los bloqueantes 1 a 5
