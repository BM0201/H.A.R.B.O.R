"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { portalFetch } from "@/lib/portal/client";

/**
 * HARBOR PASO U.0 — Canje del enlace directo firmado (`/portal/entrar?t=...`).
 * Vencido o inválido → ingreso normal, NUNCA un error.
 */
function Entrar() {
  const router = useRouter();
  const token = useSearchParams().get("t");
  const [state, setState] = useState<"working" | "expired">("working");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      if (!token) {
        router.replace("/portal");
        return;
      }
      const res = await portalFetch<{ authenticated: boolean; redirectTo?: string }>("/api/portal/auth/magic", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      if (res.data?.authenticated) {
        router.replace("/portal/casillero");
      } else {
        setState("expired");
        setTimeout(() => router.replace("/portal"), 2500);
      }
    })();
  }, [token, router]);

  return (
    <div style={{ marginTop: "3rem", textAlign: "center", color: "var(--color-text-muted, #57534E)" }}>
      {state === "working" ? (
        <p>Entrando a tu casillero…</p>
      ) : (
        <p>Este enlace venció. Te llevamos al ingreso normal…</p>
      )}
    </div>
  );
}

export default function EntrarPage() {
  return (
    <Suspense fallback={null}>
      <Entrar />
    </Suspense>
  );
}
