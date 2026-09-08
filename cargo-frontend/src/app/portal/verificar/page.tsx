"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { portalFetch } from "@/lib/portal/client";

function Verificar() {
  const router = useRouter();
  const params = useSearchParams();
  const casillero = (params.get("c") ?? "").toUpperCase();

  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4) return;
    setBusy(true);
    setError(null);
    const res = await portalFetch("/api/portal/auth/verify", {
      method: "POST",
      body: JSON.stringify({ casillero, code: code.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      router.replace("/portal/casillero");
      return;
    }
    setError(res.error?.message ?? "Código incorrecto o vencido.");
  };

  const resend = async () => {
    await portalFetch("/api/portal/auth/request-code", {
      method: "POST",
      body: JSON.stringify({ casillero }),
    });
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <h1 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 0.4rem" }}>Poné el código</h1>
      <p style={{ fontSize: "0.92rem", color: "var(--color-text-muted, #57534E)", margin: "0 0 1.5rem" }}>
        Si el casillero <strong>{casillero || "—"}</strong> existe, te llegó un código de 6 dígitos. Vence en 10 minutos.
      </p>

      <form onSubmit={submit}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
          style={{
            width: "100%",
            padding: "0.85rem 0.9rem",
            fontSize: "1.6rem",
            textAlign: "center",
            letterSpacing: "0.4em",
            fontFamily: "var(--font-mono, ui-monospace, monospace)",
            borderRadius: 10,
            border: "1px solid var(--color-border-strong, #D6D3D1)",
            background: "var(--color-surface, #fff)",
            color: "var(--color-text, #1C1917)",
          }}
        />
        {error && <p style={{ color: "#B91C1C", fontSize: "0.85rem", marginTop: 8 }}>{error}</p>}
        <button
          type="submit"
          disabled={busy || code.length < 4}
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
            opacity: busy || code.length < 4 ? 0.6 : 1,
          }}
        >
          {busy ? "Verificando…" : "Entrar"}
        </button>
      </form>

      <div style={{ marginTop: "1.25rem", display: "flex", gap: "1rem", fontSize: "0.85rem" }}>
        <button
          onClick={resend}
          style={{ background: "none", border: "none", color: "var(--color-primary-600, #0e7490)", cursor: "pointer", padding: 0 }}
        >
          {resent ? "Código reenviado" : "Reenviar código"}
        </button>
        <button
          onClick={() => router.push("/portal")}
          style={{ background: "none", border: "none", color: "var(--color-text-soft, #78716C)", cursor: "pointer", padding: 0 }}
        >
          Cambiar casillero
        </button>
      </div>
    </div>
  );
}

export default function VerificarPage() {
  return (
    <Suspense fallback={null}>
      <Verificar />
    </Suspense>
  );
}
