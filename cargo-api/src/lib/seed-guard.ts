/**
 * R.0 — Guarda de destino del seed de desarrollo.
 *
 * `prisma/seed.ts` crea usuarios demo con contraseña conocida. Nunca debe
 * correr contra una base que no sea la local esperada, ni en
 * `NODE_ENV=production`.
 *
 * El patrón está ANCLADO al host:puerto/base reales — no es substring. Un
 * patrón como `/localhost|127\.0\.0\.1|\.local\b/` dejaría pasar
 * `db.staging.localhost.corp.com` y cualquier DSN de Neon con `.local` en el
 * path.
 */

const LOCAL_DSN = /^postgres(ql)?:\/\/[^@/]+@(127\.0\.0\.1|localhost):5433\/harbor_dev(\?|$)/;

export class SeedGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SeedGuardError";
  }
}

/** Solo las claves que la guarda consulta. `process.env` es asignable. */
type SeedEnv = {
  DATABASE_URL?: string;
  NODE_ENV?: string;
  ALLOW_REMOTE_SEED?: string;
};

/**
 * Lanza `SeedGuardError` si el destino no es seguro para el seed de desarrollo.
 *
 * - `NODE_ENV=production` aborta SIN escape: `ALLOW_REMOTE_SEED` no lo levanta.
 * - Cualquier otra base que no sea `127.0.0.1:5433/harbor_dev` exige
 *   `ALLOW_REMOTE_SEED=true` explícito.
 * - El mensaje nunca incluye la `DATABASE_URL`: lleva credenciales.
 */
export function assertSeedTarget(env: SeedEnv = process.env): void {
  if (env.NODE_ENV === "production") {
    throw new SeedGuardError(
      "seed.ts crea usuarios demo con contrasena conocida. Nunca en production.",
    );
  }

  const url = env.DATABASE_URL ?? "";
  const permitidoRemoto = env.ALLOW_REMOTE_SEED === "true";

  if (!LOCAL_DSN.test(url) && !permitidoRemoto) {
    throw new SeedGuardError(
      "Rechazado: DATABASE_URL no es la base local esperada (127.0.0.1:5433/harbor_dev).\n" +
        "Para sembrar otra base a proposito: ALLOW_REMOTE_SEED=true",
    );
  }
}
