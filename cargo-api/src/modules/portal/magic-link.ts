/**
 * HARBOR PASO U.0 — Enlace directo firmado con vencimiento.
 *
 * Para mandar "acá ves tu casillero" por WhatsApp sin exponer una URL
 * adivinable con el casillero en el path. Token HMAC `{ c: customerId, e: exp }`
 * firmado con una clave DERIVADA de `AUTH_SESSION_SECRET` (no un env nuevo).
 * Un enlace vencido lleva al ingreso normal, nunca a un error.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const LABEL = "harbor-portal-magic-link-v1";
export const MAGIC_LINK_TTL_DAYS = 7;

function key(): Buffer {
  return createHmac("sha256", env.AUTH_SESSION_SECRET).update(LABEL).digest();
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString("base64url");
}

export function createMagicLinkToken(customerId: string, now: Date = new Date()): string {
  const exp = Math.floor(now.getTime() / 1000) + MAGIC_LINK_TTL_DAYS * 86_400;
  const payload = b64url(JSON.stringify({ c: customerId, e: exp }));
  const sig = b64url(createHmac("sha256", key()).update(payload).digest());
  return `${payload}.${sig}`;
}

export type MagicLinkResult =
  | { valid: true; customerId: string }
  | { valid: false; reason: "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" };

export function verifyMagicLinkToken(token: string, now: Date = new Date()): MagicLinkResult {
  const parts = (token ?? "").split(".");
  if (parts.length !== 2) return { valid: false, reason: "MALFORMED" };
  const [payload, sig] = parts;

  const expectedSig = b64url(createHmac("sha256", key()).update(payload).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { valid: false, reason: "BAD_SIGNATURE" };

  let parsed: { c?: unknown; e?: unknown };
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { valid: false, reason: "MALFORMED" };
  }
  if (typeof parsed.c !== "string" || typeof parsed.e !== "number") return { valid: false, reason: "MALFORMED" };
  if (parsed.e * 1000 <= now.getTime()) return { valid: false, reason: "EXPIRED" };
  return { valid: true, customerId: parsed.c };
}
