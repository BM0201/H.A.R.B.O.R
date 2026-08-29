# HARBOR — PASO 8: Marca, identidad visual y seguridad de dominio

> **Prompt de implementación.** Repositorio `BM0201/H.A.R.B.O.R`, rama `main`.
> Independiente del paso 7.1 (registro y frontera del strangler), que sigue
> pendiente. No toca dominio: los pasos 2–6 del §12 siguen bloqueados por los
> 5 bloqueantes duros.

---

## Estado verificado al escribir esto

| Hecho | Valor |
|---|---|
| Ocurrencias de "HAMMER" en `cargo-frontend/src/` | 66 en 19 archivos |
| Ocurrencias de "HARBOR" en `cargo-frontend/src/` | 0 |
| Rampa de marca | `--color-brand-*`, naranja-óxido, ancla `#D4380D` |
| Rampas semánticas | success/warning/danger, contraste AA verificado |
| Temas | claro y oscuro, ambos completos |
| CSP | nonce por request, `strict-dynamic`, HSTS preload |
| Split portal/staff | ruteado en `middleware.ts`, cookies y secretos separados |

La base de diseño heredada es sólida y **no se tira**. El sistema de roles
semánticos, el mapa de breakpoints y la verificación de contraste son trabajo
válido. Lo que cambia es la marca y lo que falta es el sistema de estados.

---

## Herramienta

Este proyecto tiene la skill `impeccable`. Usarla, no improvisar:

```
/impeccable init          # no existe PRODUCT.md — es bloqueante del resto
/impeccable typeset cargo-frontend/src/app/globals.css
/impeccable audit cargo-frontend/src/components/
```

Registro: **product** (la UI sirve al producto, no es el producto).
Al correr `init`, PRODUCT.md debe reflejar el §1 del documento maestro de
BM CARGO, no una descripción genérica de software logístico.

---

## PASO A — Marca y nomenclatura

### A.1 Decidir la forma del nombre

El repositorio se llama `H.A.R.B.O.R`. El documento maestro (§16) escribe
**HARBOR**, sin puntos, en las 40 veces que aparece.

Los puntos son la gramática de marca de HAMMER (`H.A.M.M.E.R.`, un acrónimo).
HARBOR no es un acrónimo: es una palabra con significado — puerto, el lugar
donde converge y se redistribuye la carga (§2). Puntearla la convierte en algo
que no es y la ata visualmente al sistema del que se está separando.

**Recomendación:** `HARBOR` en todo el producto. El nombre del repositorio se
puede dejar como está (renombrarlo rompe remotes y CI por poco beneficio), pero
la UI, los documentos y los `<title>` usan la forma sin puntos.

Decidilo explícitamente y registralo en PRODUCT.md. Lo que no puede pasar es
que convivan las dos formas.

### A.2 Barrido de las 66 ocurrencias

Los 19 archivos, agrupados por tipo de cambio:

**Marca visible al usuario** — cambia a HARBOR:
```
src/app/layout.tsx                        <title>, metadata
src/app/login/page.tsx                    marca en pantalla de acceso
src/app/app/layout.tsx                    encabezado de aplicación
src/components/layout/hammer-splash.tsx   renombrar archivo y componente
src/components/navigation/app-sidebar.tsx
src/components/ui/theme-toggle.tsx
```

**Comentarios y nombres internos** — cambia a HARBOR:
```
src/app/globals.css                       "H.A.M.M.E.R. — Design System v4"
src/lib/client/api.ts
src/lib/client/active-branch.ts
src/modules/rbac/policies.ts
```

**Módulos heredados que siguen siendo de HAMMER conceptualmente** — dejar,
con nota:
```
src/components/cash-session/*      caja, tesorería, planilla, reportes
src/components/finance/*           Son infraestructura heredada. Cambiar el
src/components/payroll/*           nombre en un comentario no los hace de
src/components/reports/*           HARBOR. Se renombran cuando migren a
src/components/brain/*             contexts/ (disparador del ADR-0007).
```

`hammer-splash.tsx` → `harbor-splash.tsx`, con el componente y su import
actualizados. Es el archivo más visible del barrido.

### A.3 Cookies: no renombrar todavía

```ts
const SESSION_COOKIE = "__Host-cargo_session";
const CUSTOMER_SESSION_COOKIE = "__Host-cargo_portal_session";
```

Renombrar a `__Host-harbor_session` **invalida toda sesión activa** — todo el
mundo queda deslogueado en el momento del deploy.

No es un problema, es un evento que se programa. Hacerlo junto con el rename de
workspaces (`cargo-*` → `harbor-*`), en una ventana de baja operación, en un
commit propio y anunciado. No como efecto colateral de un barrido de marca.

---

## PASO B — Identidad visual

### B.1 La escena, antes del tema

Regla: escribir la escena física antes de elegir claro u oscuro. Para HARBOR:

> Un operador con guantes, de pie en una nave de bodega en Miami bajo
> fluorescente intenso, escaneando cajas con una tablet en una mano. Y un
> empleado de sucursal en Managua en un mostrador, con luz de día tropical
> entrando por la puerta abierta y un cliente esperando enfrente.

La escena fuerza la respuesta: **claro por defecto**. Una interfaz oscura bajo
luz ambiente alta pierde casi todo su contraste efectivo por reflexión en la
pantalla — el vidrio se vuelve espejo. El tema oscuro se conserva (ya existe y
está bien hecho) para oficina y turno nocturno, pero no es el default.

Verificar el contraste del tema claro asumiendo **luz ambiente alta**, no una
oficina. En la práctica: subir el texto secundario hacia el extremo tinta de la
rampa. El gris claro "elegante" es el primer color que desaparece bajo un tubo
fluorescente.

### B.2 El reflejo que hay que evitar

Logística tiene una paleta refleja obvia: **azul marino + naranja/ámbar**.
Es DHL, Maersk, FedEx, y es lo que sale por defecto. Descartarla.

Y descartar también el reflejo de segundo orden — "logística que no es
azul-y-naranja" produce verde-terminal sobre negro con tipografía monoespaciada,
la estética de *dashboard de tracking para nerds*. Evitada la primera trampa,
se cae en la segunda.

Ambas son categoría adivinable desde el dominio. Si alguien puede deducir la
paleta sabiendo solo que es un sistema de carga, no está diseñada.

**Punto de partida:** correr el script de paleta de `impeccable` para obtener el
color semilla. Componer bg / surface / ink / accent / muted alrededor, en OKLCH.

**Restricciones que la paleta debe cumplir, sea cual sea el semilla:**
- Estrategia **restrained**: neutros tintados + un acento ≤10% de la superficie.
  Es una herramienta operativa; el color debe cargar información de estado, no
  decorar.
- El acento de marca **no puede colisionar** con ninguna rampa de estado del
  paso C ni con las semánticas. Si el acento es el mismo tono que un estado, la
  navegación y el dato compiten.
- Los neutros se tintan 0.005–0.015 de croma hacia el tono de la marca. No hacia
  cálido por defecto.
- Nada del banco crema/arena/beige (OKLCH L 0.84–0.97, C < 0.06, tono 40–100).

### B.3 Tipografía: los números son el problema

Esto es específico de HARBOR y no es cosmético.

La interfaz muestra todo el día: números de tracking (`BM-928174`), contenedores
(`MSKU 1234567`), AWB, pesos, dimensiones, valores declarados. Esos datos se
**leen en voz alta, se transcriben y se tipean a mano** entre bodega, aduana y
mostrador. Un `0` que se confunde con `O`, o un `1` con `l`, produce un error
operativo real: un paquete asignado al cliente equivocado.

Requisitos:
- Una familia monoespaciada con **cero rasgado o punteado** y `1`/`l`/`I`
  inequívocos, para todo identificador y toda cantidad. Verificar la que ya está
  cargada (DM Mono en `/login`) contra este criterio antes de adoptarla; si no
  cumple, cambiarla.
- `font-variant-numeric: tabular-nums` en toda columna numérica. Sin esto las
  cifras no alinean y comparar dos pesos en una tabla exige leerlas en vez de
  verlas.
- Par tipográfico sobre eje de contraste: una familia de texto + una mono. No
  dos sans parecidas.
- Los identificadores se muestran agrupados igual que se dictan
  (`MSKU 123 4567`), no como cadena corrida.

---

## PASO C — Sistema de estados (el problema central de diseño)

Ninguna pantalla de HARBOR se entiende sin saber en qué estado está un paquete.
Es el dato más repetido del producto y hoy no existe su sistema visual.

### C.1 Dos canales ortogonales

El error a evitar: usar las rampas semánticas heredadas (success / warning /
danger) para los estados del tracking.

Un paquete `IN_CUSTOMS` no es un error. No es "danger". Es la etapa 5 de un
recorrido normal. Pintarlo de rojo entrena al operador a ignorar el rojo, y el
día que un paquete esté realmente perdido el rojo ya no significa nada.

Son **dos canales independientes**:

| Canal | Qué codifica | Rampa |
|---|---|---|
| **Etapa** | Posición en el recorrido. Neutral, ordenada | Nueva. Ver C.2 |
| **Excepción** | Juicio sobre la situación: retraso, daño, pérdida | Las semánticas heredadas, sin tocar |

Un paquete tiene siempre una etapa y **opcionalmente** una excepción encima.
`IN_CUSTOMS` es etapa. `IN_CUSTOMS + 20 días detenido` es etapa con excepción.

### C.2 La rampa de etapa codifica orden

Las etapas están ordenadas, así que el color debe transmitir orden, no
identidad arbitraria. Diez colores sin relación entre sí obligan a memorizar
una leyenda; una progresión se lee.

- Recorrido de tono en OKLCH desde el origen (frío) hacia el destino (cálido),
  con **L y C constantes**. Ninguna etapa debe verse más importante que otra:
  no lo son.
- Los estados terminales rompen la rampa deliberadamente: `DELIVERED` sólido y
  distinto, porque es el final y no una posición más.
- La rampa se define una vez como tokens y **ningún componente define color de
  estado localmente**. Regla verificable: `grep` que falle si aparece un color
  de estado fuera de `globals.css`.

### C.3 Nunca solo color

El §11 exige certeza en operaciones sobre mercancía física. Un operador que va
a entregar un paquete tiene que estar seguro, no razonablemente seguro.

Cada estado se muestra **siempre** con las tres cosas: color, forma o ícono
propio, y etiqueta de texto. Sin excepción, ni siquiera en tablas densas donde
"ya se entiende por contexto". Cubre daltonismo, pantallas lavadas por el sol e
impresión en blanco y negro — las tres pasan en bodega.

---

## PASO D — Dos densidades, un sistema

Los dos usuarios de la escena (B.1) necesitan cosas opuestas y hoy hay un solo
diseño para ambos.

| | Bodega | Oficina / mostrador |
|---|---|---|
| Entrada | Táctil, con guantes | Mouse y teclado |
| Objetivo tocable | ≥ 56px (44px de WCAG no alcanza con guante) | Estándar |
| Densidad | Mínima. Una tarea por pantalla | Alta. Tablas comparables |
| Lectura | De reojo, de pie, a distancia | Sostenida, sentado |
| Escritura | Escáner. Teclado como último recurso | Teclado |

Implementación: un atributo de densidad en la raíz (`data-density="warehouse"`
o `"office"`) que remapea escala de espaciado y tamaño de objetivo mediante
tokens. **No** componentes duplicados — un solo árbol, dos escalas.

La densidad se deriva de la capacidad de la ubicación donde está el usuario, no
de una preferencia manual. Depende del modelo de `Location` (Parte III del
documento de fundación), que aún no está cerrado: por ahora, token manual y
`TODO` que apunte al bloqueante.

---

## PASO E — Seguridad de dominio

Lo heredado (CSP con nonce, HSTS, `frame-ancestors 'none'`, Turnstile,
same-origin, split portal/staff) queda como está. Esto son los huecos
específicos de HARBOR.

### E.1 Enumeración de tracking — prioridad más alta

**El problema.** El ejemplo del propio documento maestro (§11) es `BM-928174`.
Es secuencial. Si el tracking se consulta públicamente o con protección débil,
cualquiera recorre correlativos y obtiene nombre, dirección de entrega, valor
declarado y descripción de contenido de clientes ajenos. Con el valor declarado
expuesto, el listado se vuelve un catálogo de a qué casa vale la pena ir.

No es hipotético: es el modo de falla estándar de los sistemas de courier.

**Mitigaciones, las cuatro:**

1. **Código no adivinable.** El identificador público no puede ser secuencial.
   Correlativo interno para operación + sufijo aleatorio de ≥6 caracteres para
   la cara pública, o un identificador aleatorio completo. Alfabeto sin
   caracteres ambiguos (sin `0`/`O`, sin `1`/`l`/`I`), coherente con B.3.

2. **Dos niveles de detalle.** La vista pública muestra estado y fechas. **No**
   muestra nombre, dirección, teléfono, valor declarado ni contenido. El detalle
   completo exige sesión autenticada.

3. **Límite de tasa por IP** en la consulta pública, con umbral bajo. Un cliente
   real consulta su paquete unas pocas veces al día.

4. **Alcance desde la sesión, jamás desde el cliente.** En el portal, la
   consulta se resuelve con el `customerId` de la sesión. Nunca con un
   `customerId` que venga del request, ni en query, ni en body, ni en header.
   Escribirlo en el contrato del portal ahora, antes de que exista el portal
   (Fase 2), porque después se convierte en auditoría de cada endpoint.

**Prueba de aceptación:** con sesión válida del cliente A, ninguna combinación
de parámetros devuelve un paquete del cliente B. Test, no revisión manual.

### E.2 Evidencias y fotografías

§7 exige fotografías del paquete; el flujo de entrega exige firma o evidencia.
Ese material contiene contenido de la mercancía, direcciones y firmas.

- **URLs firmadas con expiración corta**, generadas por request después de
  autorizar. Nunca rutas públicas de bucket, nunca la ruta de storage embebida
  en el HTML del cliente.
- Bucket privado por defecto. Un objeto accesible sin firma es un incidente.
- **Cerrar la CSP.** Hoy: `img-src 'self' data: https:`. Ese `https:` es un
  comodín a cualquier origen. Cuando se defina el storage, acotarlo a ese
  origen exacto. Mientras no exista, dejar el comodín documentado como deuda con
  fecha, no como decisión.

### E.3 La UI oculta, el servidor autoriza

`src/modules/rbac/policies.ts` decide qué ve cada rol. Eso es experiencia de
usuario, no autorización: el bundle llega completo al navegador y las reglas se
leen ahí.

Toda ruta del backend revalida el permiso por su cuenta. Prueba: sesión válida
de `CASHIER` golpeando directamente un endpoint de bodega recibe 403 — no 200
con datos, no 404.

Es la regla que más se erosiona con el tiempo, porque esconder el botón *parece*
que resolvió el problema.

### E.4 Sin PII en almacenamiento del navegador

Valores declarados, direcciones y teléfonos no van a `localStorage` ni
`sessionStorage`. En terminal compartida de mostrador — que es el caso normal en
sucursal, no la excepción — sobreviven al cierre de sesión del operador.

Auditar los usos actuales de `localStorage` en el frontend heredado antes de
agregar datos de paquete a cualquiera de ellos.

---

## Plantillas de commit

```
docs(brand): fija HARBOR sin puntos como forma unica del nombre
refactor(brand): renombra marca visible y hammer-splash a harbor-splash
feat(theme): rampa de marca HARBOR en OKLCH, tema claro por defecto
feat(theme): rampa de etapa ortogonal a las rampas semanticas
feat(a11y): estado siempre como color + icono + etiqueta
feat(theme): densidad bodega/oficina por tokens, sin duplicar componentes
feat(typography): mono con glifos desambiguados y tabular-nums
feat(security): codigo publico de tracking no enumerable + limite de tasa
feat(security): URLs firmadas para evidencias; acota img-src
test(security): alcance por sesion en portal, sin customerId del cliente
chore!: renombra cookies y workspaces a harbor-* (invalida sesiones)
```

---

## Definición de terminado

- [ ] PRODUCT.md existe y describe BM CARGO, no software logístico genérico
- [ ] Cero ocurrencias de HAMMER fuera de los módulos heredados listados en A.2
- [ ] Forma del nombre decidida y única en todo el producto
- [ ] Paleta nueva, con contraste verificado bajo el supuesto de luz ambiente alta
- [ ] Rampa de etapa separada de las semánticas; ningún componente define color
      de estado localmente
- [ ] Todo estado se muestra con color + ícono + etiqueta
- [ ] Dos densidades por token, un solo árbol de componentes
- [ ] Mono con glifos desambiguados; `tabular-nums` en columnas numéricas
- [ ] Código público de tracking no enumerable, con vista pública mínima y
      límite de tasa
- [ ] Test que prueba que el cliente A no alcanza paquetes del cliente B
- [ ] Rename de cookies y workspaces **no** incluido aquí — va en su ventana
- [ ] Sin código de dominio. Pasos 2–6 del §12 siguen bloqueados
