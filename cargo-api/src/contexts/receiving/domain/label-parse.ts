/**
 * HARBOR PASO S.2 — Lectura de la línea de destinatario de la etiqueta.
 *
 * SÓLO PRE-LLENA. Nunca asigna (regla de confianza §S.2: el OCR lee nombre y
 * prefijo, pero un nombre mal leído se parece a otro y falla callado). El
 * resultado alimenta la bandeja de huérfanos para que un humano confirme.
 *
 * Rotulado real de BM CARGO:
 *   AirBmCargo <Nombre> <Apellido>   → aérea
 *   MarBmCargo <Nombre> <Apellido>   → marítima
 *
 * Función PURA.
 */

export type MatchMode = "AIR" | "SEA";

export type ParsedLabel = {
  /** Modalidad sugerida por el prefijo, o null si no se reconoce. */
  suggestedMode: MatchMode | null;
  /** Nombre del destinatario sin el prefijo, colapsado. */
  recipientName: string;
  /** Tokens del nombre en minúsculas, para el ranking de candidatos. */
  nameTokens: string[];
};

const PREFIX_RE = /^\s*(air|mar)\s*bm\s*cargo\b[\s:.-]*/i;

const COMBINING_MARKS = /[̀-ͯ]/g;

/** Quita tildes y baja a minúsculas — para comparar nombres de forma tolerante. */
export function foldName(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseLabelRecipient(raw: string | null | undefined): ParsedLabel {
  const text = (raw ?? "").trim();
  const prefix = text.match(PREFIX_RE);
  const suggestedMode: MatchMode | null = prefix ? (prefix[1].toLowerCase() === "air" ? "AIR" : "SEA") : null;
  const withoutPrefix = prefix ? text.slice(prefix[0].length) : text;
  const recipientName = withoutPrefix.replace(/\s+/g, " ").trim();
  const folded = foldName(recipientName);
  return {
    suggestedMode,
    recipientName,
    nameTokens: folded ? folded.split(" ").filter(Boolean) : [],
  };
}

export type CustomerCandidateInput = {
  id: string;
  code: string;
  displayName: string;
  legalName: string;
};

export type RankedCandidate = {
  id: string;
  code: string;
  displayName: string;
  /** 0..1 — cuántos tokens del nombre de la etiqueta aparecen en el del cliente. */
  score: number;
};

/**
 * Ordena clientes por parecido de nombre con la etiqueta. ESTO NO ASIGNA:
 * alimenta una lista para que un humano elija. Empisa por score desc, luego por
 * código de casillero para un orden estable.
 */
export function rankCandidates(
  parsed: ParsedLabel,
  customers: readonly CustomerCandidateInput[],
): RankedCandidate[] {
  const wanted = parsed.nameTokens;
  return customers
    .map((c) => {
      const hay = new Set(foldName(`${c.displayName} ${c.legalName}`).split(" ").filter(Boolean));
      const hits = wanted.filter((t) => hay.has(t)).length;
      const score = wanted.length === 0 ? 0 : hits / wanted.length;
      return { id: c.id, code: c.code, displayName: c.displayName, score: Number(score.toFixed(3)) };
    })
    .sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));
}
