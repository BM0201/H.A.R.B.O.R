/**
 * HARBOR PASO S — `Package.trackingCode`: identificador PÚBLICO y NO enumerable
 * (PASO 8 E.1). Va en la notificación al cliente ("Tu paquete WASRXA está en
 * bodega Doral") y en la vista pública de seguimiento, así que:
 *
 *  - no puede ser un correlativo ni derivable del `id`;
 *  - alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) porque se lee en voz
 *    alta y se teclea todo el día (PRODUCT.md, "Identifiers are load-bearing");
 *  - 6 caracteres → 32^6 ≈ 1.07e9 combinaciones. Con verificación de colisión
 *    en la capa de persistencia es suficiente para el volumen de un courier.
 *
 * TypeScript puro: `randomBytes` de `node:crypto` es la fuente de azar, sin
 * imports de Prisma / Next / @/lib (regla de dependencia del dominio).
 */
import { randomBytes } from "node:crypto";

/**
 * Dígitos 2–9 + A–Z sin I, L, O, U (Crockford) y sin O/0, I/1/L ambiguos.
 * 8 + 22 = 30 símbolos. 30^6 ≈ 7.29e8.
 */
export const TRACKING_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export const TRACKING_CODE_LENGTH = 6;

const RE_WELL_FORMED = new RegExp(`^[${TRACKING_ALPHABET}]{${TRACKING_CODE_LENGTH},}$`);

/** Entero uniforme en [0, max) sin sesgo de módulo (mismo patrón que temp-password.ts). */
function secureInt(max: number): number {
  const ceiling = 256 - (256 % max);
  let byte: number;
  do {
    byte = randomBytes(1)[0];
  } while (byte >= ceiling);
  return byte % max;
}

/**
 * Genera un `trackingCode` candidato. La unicidad final la garantiza el
 * `@unique` de la columna + reintento en la capa de infraestructura — esta
 * función solo produce azar bien formado.
 */
export function generateTrackingCode(length: number = TRACKING_CODE_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += TRACKING_ALPHABET[secureInt(TRACKING_ALPHABET.length)];
  }
  return out;
}

/** ¿Es una cadena que PODRÍA ser un `trackingCode` de HARBOR? (forma, no existencia) */
export function isWellFormedTrackingCode(value: string): boolean {
  return RE_WELL_FORMED.test(value);
}
