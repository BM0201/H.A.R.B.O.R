"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Circle, CheckCircle2 } from "lucide-react";
import { portalFetch } from "@/lib/portal/client";
import { EstadoPaquete, stageIcon } from "@/components/portal/estado-paquete";

type Step = { stage: string; label: string; state: "done" | "current" | "future"; at: string | null };
type RouteView = {
  trackingCode: string;
  status: string;
  stageLabel: string;
  mode: string;
  weightLb: number | null;
  amount: string | null;
  branchName: string | null;
  steps: Step[];
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-NI", { day: "2-digit", month: "short" }) : "";

function PaqueteDetalle() {
  const router = useRouter();
  const codigo = String(useParams().codigo ?? "");
  const [view, setView] = useState<RouteView | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await portalFetch<RouteView>(`/api/portal/paquete/${encodeURIComponent(codigo)}`);
      if (res.status === 401) return router.replace("/portal");
      if (res.status === 404 || !res.data) return setNotFound(true);
      setView(res.data);
    })();
  }, [codigo, router]);

  if (notFound) {
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <BackLink />
        <p style={{ marginTop: "1.5rem", color: "var(--color-text-muted)" }}>No encontramos ese paquete en tu casillero.</p>
      </div>
    );
  }
  if (!view) return <p style={{ marginTop: "2rem", color: "var(--color-text-muted)" }}>Cargando…</p>;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <BackLink />

      <div style={{ marginTop: "1rem", marginBottom: "1.25rem" }}>
        <h1 style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.04em", margin: "0 0 0.6rem" }}>
          {view.trackingCode}
        </h1>
        <EstadoPaquete status={view.status} mode={view.mode} />
        <div style={{ display: "flex", gap: 14, marginTop: 12, fontSize: "0.86rem", color: "var(--color-text-muted, #57534E)", flexWrap: "wrap" }}>
          <span>{view.mode === "SEA" ? "Marítimo" : "Aéreo"}</span>
          {view.weightLb != null && <span>{view.weightLb.toFixed(1)} lb</span>}
          {view.amount && <span style={{ fontWeight: 700, color: "var(--color-text, #1C1917)" }}>A pagar {view.amount}</span>}
          {view.branchName && <span>{view.branchName}</span>}
        </div>
      </div>

      <h2 style={{ fontSize: "0.82rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--color-text-soft, #78716C)", margin: "0 0 0.9rem" }}>
        Recorrido
      </h2>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {view.steps.map((s, i) => {
          const Icon = s.state === "done" ? CheckCircle2 : s.state === "current" ? stageIcon(s.stage, view.mode) : Circle;
          const color = s.state === "done" ? "#3F6212" : s.state === "current" ? "#0E7490" : "var(--color-border-strong, #D6D3D1)";
          return (
            <li key={s.stage} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", alignSelf: "stretch" }}>
                <Icon
                  size={20}
                  color={color}
                  strokeWidth={s.state === "future" ? 1.5 : 2.3}
                  fill={s.state === "current" ? "#ECFEFF" : "none"}
                />
                {i < view.steps.length - 1 && (
                  <span style={{ flex: 1, width: 2, background: s.state === "done" ? "#3F6212" : "var(--color-border, #E7E5E4)", marginTop: 2, minHeight: 22 }} />
                )}
              </div>
              <div style={{ paddingBottom: "1.1rem" }}>
                <p style={{ margin: 0, fontWeight: s.state === "future" ? 400 : 600, color: s.state === "future" ? "var(--color-text-soft, #78716C)" : "var(--color-text, #1C1917)", fontSize: "0.94rem" }}>
                  {s.label}
                </p>
                {s.at && <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--color-text-soft, #78716C)" }}>{fmt(s.at)}</p>}
              </div>
            </li>
          );
        })}
      </ol>

      <p style={{ fontSize: "0.78rem", color: "var(--color-text-soft, #78716C)", marginTop: "0.5rem", lineHeight: 1.5 }}>
        No mostramos fechas estimadas de llegada: una fecha que se incumple genera más consultas que ninguna.
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/portal/casillero"
      style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", color: "var(--color-primary-600, #0e7490)", fontSize: "0.88rem", fontWeight: 600 }}
    >
      <ArrowLeft size={15} /> Mi casillero
    </Link>
  );
}

export default function PaquetePage() {
  return (
    <Suspense fallback={null}>
      <PaqueteDetalle />
    </Suspense>
  );
}
