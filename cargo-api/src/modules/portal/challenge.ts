/**
 * HARBOR PASO U.0 — Lógica pura del código de un solo uso del portal.
 *
 * El número de casillero IDENTIFICA; este código AUTORIZA. Nada acá toca la
 * base — la parte pura es testeable sola.
 */
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

export const CODE_LENGTH = 6;
export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;

/** Código numérico de 6 dígitos, uniforme, cripto. */
export function generateCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) out += String(randomInt(0, 10));
  return out;
}

export function hashCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

/** Comparación en tiempo constante de dos hashes hex. */
export function codeHashMatches(candidateCode: string, storedHash: string): boolean {
  const a = Buffer.from(hashCode(candidateCode), "hex");
  const b = Buffer.from(storedHash, "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export type ChallengeRow = {
  codeHash: string;
  attempts: number;
  consumedAt: Date | null;
  expiresAt: Date;
};

export type VerifyOutcome =
  | { ok: true }
  | { ok: false; reason: "NO_CHALLENGE" | "EXPIRED" | "CONSUMED" | "TOO_MANY_ATTEMPTS" | "BAD_CODE" };

/**
 * ¿El código presentado autoriza? El llamador ya cargó el último challenge del
 * casillero (o null). Esta función NO muta — devuelve el veredicto; el servicio
 * incrementa `attempts` / marca `consumedAt` según el resultado.
 */
export function verifyChallenge(
  challenge: ChallengeRow | null,
  presentedCode: string,
  now: Date = new Date(),
): VerifyOutcome {
  if (!challenge) return { ok: false, reason: "NO_CHALLENGE" };
  if (challenge.consumedAt) return { ok: false, reason: "CONSUMED" };
  if (challenge.expiresAt.getTime() <= now.getTime()) return { ok: false, reason: "EXPIRED" };
  if (challenge.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  if (!codeHashMatches(presentedCode, challenge.codeHash)) return { ok: false, reason: "BAD_CODE" };
  return { ok: true };
}

export function challengeExpiry(now: Date = new Date()): Date {
  return new Date(now.getTime() + CODE_TTL_MINUTES * 60_000);
}
