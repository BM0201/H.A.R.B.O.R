"use client";

import type { LucideIcon } from "lucide-react";

/**
 * PASO R.5 — Cascarón de rutas de logística.
 *
 * El estado vacío ES documentación: declara qué va a vivir en esta pantalla,
 * qué la bloquea y qué capacidad exige. Sin "Próximamente", sin spinners
 * falsos. Cuando el dominio se desbloquee (§12 pasos 2–6), el contenido real
 * reemplaza a `<RouteShell>` y la ruta ya existe, ya está en la nav y ya está
 * en `resolveRoleHome`.
 */
export function RouteShell({
  title,
  description,
  blockedBy,
  requires,
  icon: Icon,
}: {
  title: string;
  description: string;
  blockedBy: string;
  requires: string;
  icon?: LucideIcon;
}) {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <div
          className="h-8 w-1 rounded-full"
          style={{ background: "linear-gradient(to bottom, var(--color-branch-admin-400), var(--color-branch-admin-600))" }}
        />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">{title}</h1>
          <p className="text-sm text-[var(--color-text-muted)]">{description}</p>
        </div>
      </div>

      <div className="max-w-2xl rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="flex items-start gap-3">
          {Icon ? <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--color-text-soft)]" aria-hidden /> : null}
          <div className="space-y-4 text-sm">
            <p className="text-[var(--color-text-secondary)]">
              Parte del cascarón de rutas de HARBOR (PASO R.5). El contenido de
              esta pantalla se construye con los pasos 2–6 del §12 del documento
              de fundación, hoy bloqueados.
            </p>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
              <dt className="font-semibold text-[var(--color-text-muted)]">Bloqueado por</dt>
              <dd className="text-[var(--color-text)]">{blockedBy}</dd>
              <dt className="font-semibold text-[var(--color-text-muted)]">Requiere</dt>
              <dd className="font-mono text-[var(--color-text)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {requires}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
