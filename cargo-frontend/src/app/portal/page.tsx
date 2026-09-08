"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { portalFetch } from "@/lib/portal/client";

/**
 * HARBOR PASO U.0/U.1 — Ingreso por casillero. El número IDENTIFICA; el código
 * que sigue AUTORIZA. La respuesta es idéntica exista o no el casillero.
 */
export default function PortalIngresoPage() {
  const router = useRouter();
  const [casillero, setCasillero] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = casillero.trim().toUpperCase();
    if (value.length < 3) return;
    setBusy(true);
    setMsg(null);
    await portalFetch("/api/portal/auth/request-code", {
      method: "POST",
      body: JSON.stringify({ casillero: value }),
    });
    setBusy(false);
    router.push(`/portal/verificar?c=${encodeURIComponent(value)}`);
  };

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.4rem" }}>Entrá a tu casillero</h1>
      <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted, #57534E)", margin: "0 0 1.5rem" }}>
        Poné tu número de casillero. Te mandamos un código al teléfono registrado para confirmar que sos vos.
      </p>

      <form onSubmit={submit}>
        <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: 6 }}>
          Número de casillero
        </label>
        <input
          value={casillero}
          onChange={(e) => setCasillero(e.target.value)}
          placeholder="NIC-00001"
          autoFocus
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          style={{
            width: "100%",
            padding: "0.85rem 0.9rem",
            fontSize: "1.05rem",
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            letterSpacing: "0.02em",
            borderRadius: 10,
            border: "1px solid var(--color-border-strong, #D6D3D1)",
            background: "var(--color-surface, #fff)",
            color: "var(--color-text, #1C1917)",
          }}
        />
        {msg && <p style={{ color: "#B45309", fontSize: "0.85rem", marginTop: 8 }}>{msg}</p>}
        <button
          type="submit"
          disabled={busy || casillero.trim().length < 3}
          style={{
            marginTop: "1.1rem",
            width: "100%",
            padding: "0.9rem",
            fontSize: "1rem",
            fontWeight: 700,
            borderRadius: 10,
            border: "none",
            cursor: busy ? "wait" : "pointer",
            background: "var(--color-primary-600, #0e7490)",
            color: "#fff",
            opacity: busy || casillero.trim().length < 3 ? 0.6 : 1,
          }}
        >
          {busy ? "Enviando…" : "Enviarme el código"}
        </button>
      </form>

      <p style={{ fontSize: "0.8rem", color: "var(--color-text-soft, #78716C)", marginTop: "1.75rem", lineHeight: 1.5 }}>
        ¿No tenés casillero? Lo abre BM CARGO en el mostrador — el portal no da de alta clientes.
      </p>
    </div>
  );
}
