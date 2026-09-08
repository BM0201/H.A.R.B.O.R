"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut } from "lucide-react";
import { portalFetch } from "@/lib/portal/client";
import { EstadoPaquete } from "@/components/portal/estado-paquete";

type Card = {
  trackingCode: string;
  status: string;
  stageLabel: string;
  mode: string;
  weightLb: number | null;
  amount: string | null;
  branchName: string | null;
};
type CasilleroView = {
  casillero: string;
  name: string;
  ready: Card[];
  inTransit: Card[];
  delivered: Card[];
  readyTotal: string | null;
};

export default function CasilleroPage() {
  const router = useRouter();
  const [view, setView] = useState<CasilleroView | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelivered, setShowDelivered] = useState(false);

  const load = useCallback(async () => {
    const res = await portalFetch<CasilleroView>("/api/portal/casillero");
    if (res.status === 401) {
      router.replace("/portal");
      return;
    }
    setView(res.data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const logout = async () => {
    await portalFetch("/api/portal/auth/logout", { method: "POST" });
    router.replace("/portal");
  };

  if (loading) return <p style={{ marginTop: "2rem", color: "var(--color-text-muted)" }}>Cargando…</p>;
  if (!view) return null;

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <div>
          <p style={{ fontSize: "0.78rem", color: "var(--color-text-soft, #78716C)", margin: 0 }}>Casillero</p>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, margin: "2px 0 0", fontFamily: "var(--font-mono, monospace)" }}>
            {view.casillero}
          </h1>
        </div>
        <button
          onClick={logout}
          style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "none", border: "none", color: "var(--color-text-soft, #78716C)", fontSize: "0.82rem", cursor: "pointer" }}
        >
          <LogOut size={14} /> Salir
        </button>
      </div>

      <Group title="Listos para retirar" count={view.ready.length} accent="#047857">
        {view.ready.map((p) => (
          <PkgRow key={p.trackingCode} p={p} showAmount />
        ))}
        {view.ready.length > 0 && view.readyTotal && (
          <div style={{ textAlign: "right", fontSize: "0.9rem", fontWeight: 700, padding: "0.5rem 0.15rem 0" }}>
            Total a pagar: {view.readyTotal}
          </div>
        )}
        {view.ready.length === 0 && <Empty text="Nada para retirar todavía." />}
      </Group>

      <Group title="En camino" count={view.inTransit.length} accent="#0E7490">
        {view.inTransit.map((p) => (
          <PkgRow key={p.trackingCode} p={p} />
        ))}
        {view.inTransit.length === 0 && <Empty text="Sin paquetes en tránsito." />}
      </Group>

      <Group title="Entregados" count={view.delivered.length} accent="#78716C" collapsible open={showDelivered} onToggle={() => setShowDelivered((v) => !v)}>
        {showDelivered && view.delivered.map((p) => <PkgRow key={p.trackingCode} p={p} />)}
        {showDelivered && view.delivered.length === 0 && <Empty text="Sin entregas registradas." />}
      </Group>
    </div>
  );
}

function Group({
  title,
  count,
  accent,
  children,
  collapsible,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <button
        onClick={onToggle}
        disabled={!collapsible}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          background: "none",
          border: "none",
          padding: "0 0 0.5rem",
          cursor: collapsible ? "pointer" : "default",
          color: "var(--color-text, #1C1917)",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 2, background: accent }} />
        <span style={{ fontSize: "0.92rem", fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: "0.82rem", color: "var(--color-text-soft, #78716C)" }}>{count}</span>
        {collapsible && (
          <ChevronRight
            size={16}
            style={{ marginLeft: "auto", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}
          />
        )}
      </button>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}

function PkgRow({ p, showAmount }: { p: Card; showAmount?: boolean }) {
  return (
    <Link
      href={`/portal/paquete/${p.trackingCode}`}
      style={{
        display: "block",
        textDecoration: "none",
        color: "inherit",
        background: "var(--color-surface, #fff)",
        border: "1px solid var(--color-border, #E7E5E4)",
        borderRadius: 12,
        padding: "0.85rem 0.9rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontWeight: 700, fontSize: "0.98rem", letterSpacing: "0.03em" }}>
          {p.trackingCode}
        </span>
        <ChevronRight size={16} color="var(--color-text-soft, #78716C)" />
      </div>
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <EstadoPaquete status={p.status} mode={p.mode} size="sm" />
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: "0.82rem", color: "var(--color-text-muted, #57534E)", flexWrap: "wrap" }}>
        <span>{p.mode === "SEA" ? "Marítimo" : "Aéreo"}</span>
        {p.weightLb != null && <span>{p.weightLb.toFixed(1)} lb</span>}
        {p.branchName && <span>{p.branchName}</span>}
        {showAmount && p.amount && <span style={{ marginLeft: "auto", fontWeight: 700, color: "var(--color-text, #1C1917)" }}>{p.amount}</span>}
      </div>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p style={{ fontSize: "0.85rem", color: "var(--color-text-soft, #78716C)", padding: "0.25rem 0.15rem" }}>{text}</p>
  );
}
