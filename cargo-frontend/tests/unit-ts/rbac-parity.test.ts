/**
 * PASO R.1 — Paridad del catálogo RBAC entre frontend y backend.
 *
 * `cargo-frontend/src/modules/rbac/policies.ts` es una copia a mano del
 * catálogo del backend. Nada garantizaba que siguieran iguales: la divergencia
 * no falla ruidosamente, se manifiesta como un botón visible que devuelve 403
 * o —peor— un botón oculto sobre un endpoint que sí autoriza.
 *
 * Este test falla si difieren. La regla que lo sostiene: **la UI oculta, el
 * servidor autoriza**. `policies.ts` en el frontend existe para no mostrar
 * botones muertos; toda ruta del backend revalida por su cuenta.
 *
 * Los `import type` del backend (`@prisma/client`, `@/types/auth`) los borra
 * el transpilador antes de ejecutar, así que importarlo desde acá no arrastra
 * ninguna dependencia de servidor.
 */
import test from "node:test";
import assert from "node:assert/strict";

import { CAPABILITIES as FE_CAPS, ROLE_CAPABILITIES as FE_ROLES } from "@/modules/rbac/policies";
import {
  CAPABILITIES as BE_CAPS,
  ROLE_CAPABILITIES as BE_ROLES,
} from "../../../cargo-api/src/modules/rbac/policies";

function diff(a: Iterable<string>, b: Iterable<string>): { onlyA: string[]; onlyB: string[] } {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    onlyA: [...setA].filter((x) => !setB.has(x)).sort(),
    onlyB: [...setB].filter((x) => !setA.has(x)).sort(),
  };
}

test("rbac-parity: el conjunto de claves de CAPABILITIES es idéntico", () => {
  const d = diff(Object.keys(FE_CAPS), Object.keys(BE_CAPS));
  assert.deepEqual(
    d,
    { onlyA: [], onlyB: [] },
    `\n  solo en frontend: ${d.onlyA.join(", ") || "—"}\n  solo en backend:  ${d.onlyB.join(", ") || "—"}`,
  );
});

test("rbac-parity: el conjunto de valores (strings) de CAPABILITIES es idéntico", () => {
  const d = diff(Object.values(FE_CAPS), Object.values(BE_CAPS));
  assert.deepEqual(d, { onlyA: [], onlyB: [] }, `\n  ${JSON.stringify(d)}`);
});

test("rbac-parity: el conjunto de roles es idéntico", () => {
  const d = diff(Object.keys(FE_ROLES), Object.keys(BE_ROLES));
  assert.deepEqual(d, { onlyA: [], onlyB: [] }, `\n  ${JSON.stringify(d)}`);
});

test("rbac-parity: cero capacidades de módulos amputados en Fase 0.2 (PASO R.1b)", () => {
  // Prefijos de módulos que ya NO existen: pos, inventory, catalog, production,
  // purchases, transfers, devoluciones/cancelaciones/notas de crédito, y el
  // pricing costo+margen de ferretería (el tarifario courier es `rate.*`).
  const DEAD = [
    "pos.",
    "inventory.",
    "master.catalog",
    "branch.catalog",
    "production.",
    "purchases.",
    "transfers.",
    "sale.return.",
    "sale.cancellation.",
    "credit-note.",
    "damaged-inventory.",
    "master.sales.view",
    "sales.draft.",
    "sales.submit.",
    "pricing.",
    "finance.view_pricing",
    "finance.manage_pricing",
  ];
  const offenders = Object.values(BE_CAPS).filter((v) => DEAD.some((p) => v.startsWith(p)));
  assert.deepEqual(offenders, [], `\n  capacidades muertas todavía en el catálogo: ${offenders.join(", ")}`);
});

test("rbac-parity: para cada rol, el conjunto de capacidades es idéntico", () => {
  const roles = new Set([...Object.keys(FE_ROLES), ...Object.keys(BE_ROLES)]);
  const mismatches: string[] = [];
  for (const role of roles) {
    const fe = (FE_ROLES as Record<string, string[]>)[role] ?? [];
    const be = (BE_ROLES as Record<string, string[]>)[role] ?? [];
    const d = diff(fe, be);
    if (d.onlyA.length || d.onlyB.length) {
      mismatches.push(
        `  ${role}:\n    solo frontend: ${d.onlyA.join(", ") || "—"}\n    solo backend:  ${d.onlyB.join(", ") || "—"}`,
      );
    }
  }
  assert.equal(mismatches.length, 0, `\n${mismatches.join("\n")}`);
});
