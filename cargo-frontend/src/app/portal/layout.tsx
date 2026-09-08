import type { ReactNode } from "react";
import type { Metadata } from "next";
import { Anchor } from "lucide-react";

export const metadata: Metadata = {
  title: "Mi casillero · HARBOR",
  description: "Seguí tus paquetes: qué llegó, qué está en camino y cuánto pagás.",
};

/**
 * HARBOR PASO U.1 — Shell del portal del cliente. Público, uso poco frecuente,
 * MÓVIL PRIMERO, gente no entrenada. Misma marca, otra densidad: objetivos
 * grandes, una columna, tema claro.
 */
export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--color-page-bg, #ECEBE7)",
        color: "var(--color-text, #1C1917)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          padding: "1rem 1.15rem",
          borderBottom: "1px solid var(--color-border, #E7E5E4)",
          background: "var(--color-surface, #fff)",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: 8,
            background: "var(--color-brand-500, #1f2937)",
          }}
        >
          <Anchor size={16} color="#fff" />
        </span>
        <strong style={{ fontSize: "1rem", letterSpacing: "-0.01em" }}>HARBOR</strong>
        <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "var(--color-text-soft, #78716C)" }}>
          Mi casillero
        </span>
      </header>

      <main
        style={{
          flex: 1,
          width: "100%",
          maxWidth: 480,
          margin: "0 auto",
          padding: "1.15rem 1.15rem 3rem",
        }}
      >
        {children}
      </main>
    </div>
  );
}
