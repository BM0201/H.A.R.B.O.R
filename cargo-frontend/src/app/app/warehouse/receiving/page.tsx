"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Package, ScanLine, Scale, CheckCircle2, AlertTriangle, ArrowRight, Truck } from "lucide-react";
import { apiFetch, unwrapApiData } from "@/lib/client/api";
import { useSession } from "@/lib/client/session";
import { getActiveBranchId } from "@/lib/client/active-branch";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

/**
 * HARBOR PASO S — Recepción en origen (Doral). Pantalla funcional del primer
 * vertical slice: escanear → ver a quién apunta → pesar → confirmar.
 * El estado real de este flujo lo lleva el backend (contexto `receiving`).
 */

type ScanPreview = {
  raw: string;
  normalized: string;
  carrier: string;
  suggestedMode: "AIR" | "SEA" | null;
  recipientName: string;
};

type ReceiveResult = {
  outcome: "ASSIGNED" | "ORPHAN" | "MODE_REVIEW";
  carrierGuess: string;
  normalizedTracking: string;
  package: {
    id: string;
    trackingCode: string;
    status: string;
    mode: string;
    customerId: string | null;
    weightOriginLb: number | null;
    chargeableLb: number | null;
    quoteSubtotal: number | null;
    quoteCurrency: string | null;
  };
};

const MODE_LABEL: Record<string, string> = { AIR: "Aérea", SEA: "Marítima" };

export default function ReceivingPage() {
  const sessionState = useSession();
  const branchId = useMemo(() => {
    if (sessionState.status !== "authenticated") return "";
    return getActiveBranchId(sessionState.session.branchIds, sessionState.session.primaryBranchId);
  }, [sessionState]);

  const [barcode, setBarcode] = useState("");
  const [label, setLabel] = useState("");
  const [preview, setPreview] = useState<ScanPreview | null>(null);
  const [mode, setMode] = useState<"AIR" | "SEA">("AIR");
  const [weight, setWeight] = useState("");
  const [dims, setDims] = useState({ l: "", w: "", h: "" });
  const [declaredValue, setDeclaredValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ReceiveResult | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const resetForNext = useCallback(() => {
    setBarcode("");
    setLabel("");
    setPreview(null);
    setWeight("");
    setDims({ l: "", w: "", h: "" });
    setDeclaredValue("");
    setResult(null);
    barcodeRef.current?.focus();
  }, []);

  const doScan = useCallback(async () => {
    if (barcode.trim().length < 3) return;
    setBusy(true);
    try {
      const res = await apiFetch("/api/receiving/scan", {
        method: "POST",
        body: JSON.stringify({ rawBarcode: barcode.trim(), labelRecipientRaw: label.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "No se pudo leer el código");
        return;
      }
      const data = unwrapApiData(json) as ScanPreview;
      setPreview(data);
      if (data.suggestedMode) setMode(data.suggestedMode);
    } finally {
      setBusy(false);
    }
  }, [barcode, label]);

  const doReceive = useCallback(
    async (override = false) => {
      setBusy(true);
      try {
        const w = weight.trim() ? Number(weight) : null;
        const body = {
          rawBarcode: barcode.trim(),
          labelRecipientRaw: label.trim() || null,
          declaredMode: mode,
          originBranchId: branchId || null,
          declaredValue: declaredValue.trim() ? Number(declaredValue) : null,
          weightOriginLb: w,
          lengthIn: dims.l ? Number(dims.l) : null,
          widthIn: dims.w ? Number(dims.w) : null,
          heightIn: dims.h ? Number(dims.h) : null,
          weightSource: "MANUAL" as const,
          overrideModeMismatch: override,
        };
        const res = await apiFetch("/api/receiving/receive", { method: "POST", body: JSON.stringify(body) });
        const json = await res.json();
        if (!res.ok) {
          const code = json.error?.code;
          if (code === "MODE_MISMATCH") {
            const d = json.error?.details ?? {};
            toast(
              (t) => (
                <span className="text-sm">
                  La pre-alerta dice <b>{MODE_LABEL[d.preAlertMode] ?? d.preAlertMode}</b> y la etiqueta{" "}
                  <b>{MODE_LABEL[d.labelMode] ?? d.labelMode}</b>. Cambia el precio.
                  <button
                    className="ml-2 underline"
                    onClick={() => {
                      toast.dismiss(t.id);
                      void doReceive(true);
                    }}
                  >
                    Recibir igual (a revisión)
                  </button>
                </span>
              ),
              { duration: 8000 },
            );
            return;
          }
          if (code === "DUPLICATE_ORIGIN_TRACKING") {
            toast.error(`Ese tracking ya está recibido (${json.error?.details?.trackingCode ?? "?"})`);
            return;
          }
          if (code === "AMBIGUOUS_PREALERT_MATCH") {
            toast.error("Dos pre-alertas reclaman ese tracking. Resolver a mano.");
            return;
          }
          if (code === "NO_APPLICABLE_RATE") {
            toast.error("No hay tarifa vigente para esa modalidad. Cargala primero.");
            return;
          }
          toast.error(json.error?.message ?? "No se pudo recibir");
          return;
        }
        const data = unwrapApiData(json) as ReceiveResult;
        setResult(data);
        if (data.outcome === "ORPHAN") toast("Huérfano — sin pre-alerta. Va a la bandeja.", { icon: "📦" });
        else if (data.outcome === "MODE_REVIEW") toast("Recibido con discrepancia de modalidad — marcado para revisión.", { icon: "⚠️" });
        else toast.success(`Recibido: ${data.package.trackingCode}`);
      } finally {
        setBusy(false);
      }
    },
    [barcode, label, mode, branchId, declaredValue, weight, dims],
  );

  if (sessionState.status === "loading") {
    return <div className="p-6 text-sm text-[var(--color-text-muted)]">Cargando…</div>;
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 p-1">
      <header className="flex items-center gap-3">
        <div className="rounded-lg bg-[var(--color-warehouse-origin-50,#ecfdf5)] p-2">
          <Package className="h-5 w-5 text-[var(--color-warehouse-origin-600,#059669)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Recepción en origen</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Identificación contra pre-alerta, pesaje y cotización — bodega de Doral.
          </p>
        </div>
        <Link
          href="/app/warehouse/orphans"
          className="ml-auto text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          Bandeja de huérfanos →
        </Link>
      </header>

      {result ? (
        <ResultCard result={result} onNext={resetForNext} />
      ) : (
        <>
          {/* 1. Escaneo */}
          <Card>
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <ScanLine className="h-4 w-4" /> Código de barras del carrier
              </label>
              <div className="flex gap-2">
                <Input
                  ref={barcodeRef}
                  autoFocus
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void doScan();
                  }}
                  placeholder="Escaneá o tecleá el tracking"
                  className="font-mono"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                />
                <Button onClick={() => void doScan()} loading={busy} disabled={barcode.trim().length < 3}>
                  Leer
                </Button>
              </div>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Línea de destinatario de la etiqueta (opcional — solo pre-llena)"
              />
            </div>
          </Card>

          {/* 2. Previsualización del match */}
          {preview && (
            <Card>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5">
                  <span className="text-[var(--color-text-muted)]">Carrier</span>
                  <span className="font-medium">{preview.carrier}</span>
                  <span className="text-[var(--color-text-muted)]">Tracking normalizado</span>
                  <span className="font-mono" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {preview.normalized}
                  </span>
                  {preview.recipientName && (
                    <>
                      <span className="text-[var(--color-text-muted)]">Nombre en etiqueta</span>
                      <span>{preview.recipientName}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-text-muted)]">Modalidad</span>
                  {(["AIR", "SEA"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                        mode === m
                          ? "bg-[var(--color-primary-600)] text-white"
                          : "bg-[var(--color-surface-2,#f1f5f9)] text-[var(--color-text)]"
                      }`}
                    >
                      {MODE_LABEL[m]}
                      {preview.suggestedMode === m ? " ·  etiqueta" : ""}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {/* 3. Pesaje + cotización */}
          {preview && (
            <Card>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                  <Scale className="h-4 w-4" /> Pesaje y medición
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <LabeledInput label="Peso (lb)" value={weight} onChange={setWeight} placeholder="0.0" />
                  <LabeledInput label="Largo (in)" value={dims.l} onChange={(v) => setDims((d) => ({ ...d, l: v }))} />
                  <LabeledInput label="Ancho (in)" value={dims.w} onChange={(v) => setDims((d) => ({ ...d, w: v }))} />
                  <LabeledInput label="Alto (in)" value={dims.h} onChange={(v) => setDims((d) => ({ ...d, h: v }))} />
                </div>
                <LabeledInput
                  label="Valor declarado (opcional)"
                  value={declaredValue}
                  onChange={setDeclaredValue}
                  placeholder="USD"
                />
                <p className="text-xs text-[var(--color-text-soft)]">
                  Las dimensiones se guardan siempre. El volumétrico no entra en el cobro hasta que el dueño lo
                  decida (D-1).
                </p>
                <Button onClick={() => void doReceive(false)} loading={busy} icon={<ArrowRight className="h-4 w-4" />}>
                  Recibir paquete
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </section>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-xs font-medium text-[var(--color-text-muted)]">
      {label}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder={placeholder}
        className="mt-1 font-mono"
        style={{ fontVariantNumeric: "tabular-nums" }}
      />
    </label>
  );
}

function ResultCard({ result, onNext }: { result: ReceiveResult; onNext: () => void }) {
  const p = result.package;
  const isOrphan = result.outcome === "ORPHAN";
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          {isOrphan ? (
            <AlertTriangle className="h-6 w-6 text-[var(--color-warning-500,#f59e0b)]" />
          ) : (
            <CheckCircle2 className="h-6 w-6 text-[var(--color-success-500,#22c55e)]" />
          )}
          <div>
            <p className="text-lg font-bold text-[var(--color-text)]">
              {p.trackingCode}
              <span className="ml-2 text-sm font-normal text-[var(--color-text-muted)]">
                {isOrphan ? "huérfano" : result.outcome === "MODE_REVIEW" ? "recibido · revisar modalidad" : "recibido"}
              </span>
            </p>
            <p className="text-xs text-[var(--color-text-soft)]">
              {result.carrierGuess} · {result.normalizedTracking}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
          <span className="text-[var(--color-text-muted)]">Modalidad</span>
          <span>{MODE_LABEL[p.mode] ?? p.mode}</span>
          <span className="text-[var(--color-text-muted)]">Peso</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {p.weightOriginLb != null ? `${p.weightOriginLb.toFixed(1)} lb` : "pendiente"}
          </span>
          <span className="text-[var(--color-text-muted)]">A pagar</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {p.quoteSubtotal != null
              ? `${p.quoteCurrency === "NIO" ? "C$" : "$"}${p.quoteSubtotal.toFixed(2)}`
              : isOrphan
                ? "— asigná el dueño primero"
                : "pendiente"}
          </span>
        </div>

        <div className="flex gap-2">
          <Button onClick={onNext} icon={<ScanLine className="h-4 w-4" />}>
            Siguiente paquete
          </Button>
          {isOrphan && (
            <Link href="/app/warehouse/orphans">
              <Button variant="secondary" icon={<Truck className="h-4 w-4" />}>
                Ir a la bandeja
              </Button>
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
