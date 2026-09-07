"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PackageSearch, ChevronRight, ChevronDown, UserCheck } from "lucide-react";
import { apiFetch, unwrapApiData } from "@/lib/client/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

/**
 * HARBOR PASO S.2 — Bandeja de huérfanos. Paquetes que llegaron sin pre-alerta.
 * `ORPHAN` es un estado normal del negocio, no un error. La asignación la
 * confirma un humano; el ranking por nombre sólo ordena, nunca decide.
 */

type Orphan = {
  id: string;
  trackingCode: string;
  originCarrier: string | null;
  originTrackingNumber: string | null;
  labelRecipientRaw: string | null;
  mode: string;
  ageDays: number;
};

type Candidate = { id: string; code: string; displayName: string; score: number };

const MODE_LABEL: Record<string, string> = { AIR: "Aérea", SEA: "Marítima" };

export default function OrphansPage() {
  const [orphans, setOrphans] = useState<Orphan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/receiving/orphans");
      const json = await res.json();
      if (res.ok) setOrphans(unwrapApiData(json) as Orphan[]);
      else toast.error(json.error?.message ?? "No se pudo cargar la bandeja");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <div className="p-6 text-sm text-[var(--color-text-muted)]">Cargando…</div>;

  return (
    <section className="mx-auto max-w-3xl space-y-4 p-1">
      <header className="flex items-center gap-3">
        <div className="rounded-lg bg-[var(--color-warning-50,#fffbeb)] p-2">
          <PackageSearch className="h-5 w-5 text-[var(--color-warning-600,#d97706)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Bandeja de huérfanos</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {orphans.length} paquete{orphans.length === 1 ? "" : "s"} sin pre-alerta que lo reclame.
          </p>
        </div>
        <Link
          href="/app/warehouse/receiving"
          className="ml-auto text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          ← Recepción
        </Link>
      </header>

      {orphans.length === 0 ? (
        <Card>
          <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
            Nada pendiente. Los paquetes sin pre-alerta aparecen acá para asignarles dueño.
          </p>
        </Card>
      ) : (
        orphans.map((o) => (
          <OrphanRow
            key={o.id}
            orphan={o}
            open={openId === o.id}
            onToggle={() => setOpenId((cur) => (cur === o.id ? null : o.id))}
            onAssigned={() => {
              setOpenId(null);
              void load();
            }}
          />
        ))
      )}
    </section>
  );
}

function OrphanRow({
  orphan,
  open,
  onToggle,
  onAssigned,
}: {
  orphan: Orphan;
  open: boolean;
  onToggle: () => void;
  onAssigned: () => void;
}) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [suggestedMode, setSuggestedMode] = useState<"AIR" | "SEA" | null>(null);
  const [mode, setMode] = useState<"AIR" | "SEA">("AIR");
  const [chosen, setChosen] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || candidates) return;
    void (async () => {
      const res = await apiFetch(`/api/receiving/orphans/${orphan.id}/candidates`);
      const json = await res.json();
      if (res.ok) {
        const data = unwrapApiData(json) as { candidates: Candidate[]; suggestedMode: "AIR" | "SEA" | null };
        setCandidates(data.candidates);
        setSuggestedMode(data.suggestedMode);
        if (data.suggestedMode) setMode(data.suggestedMode);
      }
    })();
  }, [open, candidates, orphan.id]);

  const assign = useCallback(async () => {
    if (!chosen) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/receiving/orphans/${orphan.id}/assign`, {
        method: "POST",
        body: JSON.stringify({ customerId: chosen, mode }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "No se pudo asignar");
        return;
      }
      toast.success(`${orphan.trackingCode} asignado`);
      onAssigned();
    } finally {
      setBusy(false);
    }
  }, [chosen, mode, orphan.id, orphan.trackingCode, onAssigned]);

  return (
    <Card noPadding>
      <button onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-sm font-semibold text-[var(--color-text)]" style={{ fontVariantNumeric: "tabular-nums" }}>
            {orphan.trackingCode}
            <span className="ml-2 font-sans text-xs font-normal text-[var(--color-text-muted)]">
              {orphan.originCarrier ?? "carrier ?"} · {orphan.originTrackingNumber}
            </span>
          </p>
          <p className="truncate text-xs text-[var(--color-text-soft)]">
            {orphan.labelRecipientRaw || "sin nombre en etiqueta"}
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {orphan.ageDays === 0 ? "hoy" : `${orphan.ageDays} d`}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[var(--color-text-muted)]">Modalidad</span>
            {(["AIR", "SEA"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1 text-sm font-medium ${
                  mode === m ? "bg-[var(--color-primary-600)] text-white" : "bg-[var(--color-surface-2,#f1f5f9)]"
                }`}
              >
                {MODE_LABEL[m]}
                {suggestedMode === m ? " · etiqueta" : ""}
              </button>
            ))}
          </div>

          <p className="text-xs text-[var(--color-text-soft)]">
            Candidatos ordenados por parecido de nombre. El orden <b>no decide</b> — elegí vos.
          </p>
          <div className="space-y-1">
            {(candidates ?? []).length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)]">Sin candidatos por nombre. Buscá el casillero.</p>
            )}
            {(candidates ?? []).map((c) => (
              <label
                key={c.id}
                className={`flex cursor-pointer items-center gap-3 rounded-md border p-2 text-sm ${
                  chosen === c.id ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50,#eff6ff)]" : "border-[var(--color-border)]"
                }`}
              >
                <input type="radio" name={`c-${orphan.id}`} checked={chosen === c.id} onChange={() => setChosen(c.id)} />
                <span className="font-mono text-xs">{c.code}</span>
                <span className="flex-1">{c.displayName}</span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {c.score > 0 ? `${Math.round(c.score * 100)}%` : "—"}
                </span>
              </label>
            ))}
          </div>

          <Button onClick={() => void assign()} loading={busy} disabled={!chosen} icon={<UserCheck className="h-4 w-4" />}>
            Asignar dueño
          </Button>
        </div>
      )}
    </Card>
  );
}
