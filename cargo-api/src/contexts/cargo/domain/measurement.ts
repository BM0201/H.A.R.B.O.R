/**
 * HARBOR PASO S — matemática pura de medición del paquete. Sin base de datos,
 * sin Prisma. Cubre D-1 (peso volumétrico) y D-2 (discrepancia entre pesajes).
 *
 * Decisiones interinas (PRODUCT.md, "Open product decisions"):
 *  - D-1: se capturan L/W/H SIEMPRE; el volumétrico solo entra al cálculo si la
 *    tarifa trae `volumetricDivisor`. Hoy es `null` en todas → volumétrico = 0.
 *  - D-2: se guardan ambos pesos, se factura sobre el de ORIGEN, y se marca el
 *    paquete si |(customs - origin) / origin| > 0.05.
 */

export const WEIGHT_VARIANCE_FLAG_THRESHOLD = 0.05;

export type Dimensions = {
  lengthIn: number;
  widthIn: number;
  heightIn: number;
};

function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * f) / f;
}

/**
 * Peso volumétrico en libras: `(L × W × H) / divisor`. Con `divisor` nulo o no
 * positivo → 0 (D-1 apagado). Redondea a 2 decimales.
 */
export function computeVolumetricLb(dims: Partial<Dimensions> | null, divisor: number | null | undefined): number {
  if (!divisor || divisor <= 0 || !dims) return 0;
  const { lengthIn, widthIn, heightIn } = dims;
  if (!lengthIn || !widthIn || !heightIn) return 0;
  if (lengthIn <= 0 || widthIn <= 0 || heightIn <= 0) return 0;
  return round((lengthIn * widthIn * heightIn) / divisor, 2);
}

/**
 * Peso facturable = `max(peso real, peso volumétrico)`. Con volumétrico 0
 * (D-1 apagado) es simplemente el peso real.
 */
export function computeChargeableLb(actualLb: number, volumetricLb: number): number {
  const chargeable = Math.max(actualLb, volumetricLb || 0);
  return round(chargeable, 2);
}

/**
 * Varianza relativa entre el pesaje de aduana y el de origen: `(c - o) / o`.
 * `null` si falta alguno de los dos o si el de origen es 0 (no se puede dividir).
 * Redondea a 4 decimales.
 */
export function computeWeightVariance(originLb: number | null | undefined, customsLb: number | null | undefined): number | null {
  if (originLb == null || customsLb == null) return null;
  if (originLb <= 0) return null;
  return round((customsLb - originLb) / originLb, 4);
}

/** ¿La varianza supera el umbral (5%) y hay que marcar el paquete? */
export function isWeightVarianceFlagged(variance: number | null): boolean {
  if (variance == null) return false;
  return Math.abs(variance) > WEIGHT_VARIANCE_FLAG_THRESHOLD;
}
