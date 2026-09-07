/**
 * HARBOR PASO S.2 — Normalización del tracking del carrier de origen.
 *
 * Los lectores de código de barras devuelven el tracking embebido en cadenas
 * más largas (IMpb de USPS, barcode "96" de FedEx, prefijos de aplicación GS1).
 * El match con la pre-alerta se hace sobre la forma NORMALIZADA, no la cruda.
 *
 * Función PURA, testeable sin base de datos (regla del dominio). Nunca lanza:
 * ante algo que no reconoce, devuelve `carrier: "UNKNOWN"` y una normalización
 * conservadora (alfanumérico en mayúsculas) para que un match exacto siga
 * siendo posible si la pre-alerta trae la misma cadena.
 */

export type CarrierGuess = "USPS" | "UPS" | "FEDEX" | "AMAZON" | "UNKNOWN";

export type NormalizedTracking = {
  /** Tal cual salió del lector, recortado. Evidencia. */
  raw: string;
  /** Forma canónica para el match. Mayúsculas, sin separadores. */
  normalized: string;
  carrier: CarrierGuess;
};

const onlyDigits = (s: string) => s.replace(/\D+/g, "");
const alnumUpper = (s: string) => s.toUpperCase().replace(/[^0-9A-Z]+/g, "");

/** UPS: `1Z` + 16 alfanuméricos. Puede venir con espacios. */
function matchUps(alnum: string): string | null {
  const m = alnum.match(/1Z[0-9A-Z]{16}/);
  return m ? m[0] : null;
}

/** Amazon Logistics: `TBA` + 12 dígitos. */
function matchAmazon(alnum: string): string | null {
  const m = alnum.match(/TBA\d{12}/);
  return m ? m[0] : null;
}

/**
 * USPS IMpb: `[420 + ZIP(5|9)]` opcional + servicio (`92`/`93`/`94`/`95`/`93`) +
 * cuerpo. El tracking "hablado" son 22 dígitos (a veces 20). Se prueba quitar
 * el prefijo de destino de varias formas y se acepta la primera que empiece por
 * un código de servicio conocido.
 */
const USPS_SERVICE = /^(91|92|93|94|95)/;

function matchUsps(digits: string): string | null {
  const candidates: string[] = [];
  if (/^420\d{5}/.test(digits)) candidates.push(digits.slice(8)); // 420 + ZIP5
  if (/^420\d{9}/.test(digits)) candidates.push(digits.slice(12)); // 420 + ZIP9 (+4)
  candidates.push(digits);

  for (const c of candidates) {
    if (USPS_SERVICE.test(c) && (c.length === 22 || c.length === 20)) return c;
    if (USPS_SERVICE.test(c) && c.length > 22) return c.slice(-22);
  }
  // Numérico "pelado" de 20/22 dígitos sin prefijo 420.
  if (!digits.startsWith("420") && (digits.length === 22 || digits.length === 20)) return digits;
  return null;
}

/**
 * FedEx: 12, 15 o 20 dígitos. El barcode "96" (Ground, 34 dígitos) y el
 * SSCC-18 llevan el tracking al final — se toman los últimos 12/15/20.
 */
function matchFedex(digits: string): string | null {
  if (digits.length === 12 || digits.length === 15 || digits.length === 20) return digits;
  // Barcode "96" de FedEx Ground (34 dígitos): los últimos 12 son el tracking.
  if (digits.length === 34 && digits.startsWith("96")) return digits.slice(-12);
  return null;
}

export function normalizeCarrierTracking(input: string): NormalizedTracking {
  const raw = (input ?? "").trim();
  const alnum = alnumUpper(raw);
  const digits = onlyDigits(raw);

  const ups = matchUps(alnum);
  if (ups) return { raw, normalized: ups, carrier: "UPS" };

  const amazon = matchAmazon(alnum);
  if (amazon) return { raw, normalized: amazon, carrier: "AMAZON" };

  const usps = matchUsps(digits);
  if (usps) return { raw, normalized: usps, carrier: "USPS" };

  const fedex = matchFedex(digits);
  if (fedex) return { raw, normalized: fedex, carrier: "FEDEX" };

  // Nada reconocido: normalización conservadora. Un match exacto sigue siendo
  // posible si la pre-alerta trae la misma cadena.
  return { raw, normalized: alnum, carrier: "UNKNOWN" };
}

/** Igual que arriba pero devuelve sólo la forma canónica — para comparar. */
export function canonicalTracking(input: string): string {
  return normalizeCarrierTracking(input).normalized;
}
