"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, PackageCheck, Wallet, Clock, ChevronRight, Link2, Printer, X } from "lucide-react";
import { apiFetch, unwrapApiData } from "@/lib/client/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";

/**
 * HARBOR PASO U.2 — Mostrador. No es vender: encontrar a la persona, ver su
 * casillero, cobrar, entregar, facturar. Cobrar y entregar son hechos separados.
 */

type SearchResult =
  | { kind: "casillero"; customerId: string }
  | { kind: "package"; customerId: string | null; trackingCode: string }
  | { kind: "customers"; matches: { id: string; code: string; displayName: string; phone: string | null }[] }
  | { kind: "empty" };

type Available = {
  id: string;
  trackingCode: string;
  mode: string;
  weightLb: number | null;
  chargeableLb: number | null;
  amount: string | null;
  amountValue: number;
  currency: string;
  billedOrder: { id: string; status: string } | null;
};
type CasilleroView = {
  customerId: string;
  casillero: string;
  name: string;
  phone: string | null;
  hasCredit: boolean;
  creditAvailable: number;
  available: Available[];
  onTheWay: { id: string; trackingCode: string; mode: string; status: string }[];
  deliveredCount: number;
};
type Recent = { id: string; code: string; displayName: string; at: string };

export default function CounterPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [recent, setRecent] = useState<Recent[]>([]);
  const [view, setView] = useState<CasilleroView | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [handoverOpen, setHandoverOpen] = useState(false);

  const loadRecent = useCallback(async () => {
    const res = await apiFetch("/api/counter/recent");
    if (res.ok) setRecent(unwrapApiData(await res.json()) as Recent[]);
  }, []);
  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  const openCasillero = useCallback(async (customerId: string) => {
    setBusy(true);
    try {
      const res = await apiFetch(`/api/counter/casillero/${customerId}`);
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? "No se pudo abrir el casillero");
        return;
      }
      setView(unwrapApiData(json) as CasilleroView);
      setResults(null);
      setSelected(new Set());
      void loadRecent();
    } finally {
      setBusy(false);
    }
  }, [loadRecent]);

  const doSearch = useCallback(async () => {
    if (q.trim().length < 2) return;
    setBusy(true);
    try {
      const res = await apiFetch(`/api/counter/search?q=${encodeURIComponent(q.trim())}`);
      const data = unwrapApiData(await res.json()) as SearchResult;
      if (data.kind === "casillero") return void openCasillero(data.customerId);
      if (data.kind === "package" && data.customerId) return void openCasillero(data.customerId);
      setResults(data);
    } finally {
      setBusy(false);
    }
  }, [q, openCasillero]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectedPkgs = useMemo(() => (view?.available ?? []).filter((p) => selected.has(p.id)), [view, selected]);
  const total = selectedPkgs.reduce((a, p) => a + p.amountValue, 0);
  const currency = selectedPkgs[0]?.currency ?? "USD";
  const unbilled = selectedPkgs.filter((p) => !p.billedOrder);
  const unpaid = selectedPkgs.filter((p) => p.billedOrder?.status !== "PAID");

  const bill = async () => {
    if (!view || unbilled.length === 0) return;
    setBusy(true);
    try {
      const res = await apiFetch("/api/counter/bill", {
        method: "POST",
        body: JSON.stringify({ customerId: view.customerId, packageIds: unbilled.map((p) => p.id) }),
      });
      const json = await res.json();
      if (!res.ok) return void toast.error(json.error?.message ?? "No se pudo facturar");
      toast.success("Factura creada");
      await openCasillero(view.customerId);
    } finally {
      setBusy(false);
    }
  };

  const collect = async () => {
    if (!view) return;
    const orders = new Set(selectedPkgs.map((p) => p.billedOrder?.id).filter(Boolean) as string[]);
    if (orders.size === 0) return void toast.error("Facturá primero");
    setBusy(true);
    try {
      for (const orderId of orders) {
        const res = await apiFetch("/api/counter/collect", {
          method: "POST",
          body: JSON.stringify({ saleOrderId: orderId, method: "CASH" }),
        });
        const json = await res.json();
        if (!res.ok) {
          toast.error(json.error?.message ?? "No se pudo cobrar");
          break;
        }
      }
      toast.success("Cobrado");
      await openCasillero(view.customerId);
    } finally {
      setBusy(false);
    }
  };

  const magicLink = async () => {
    if (!view) return;
    const res = await apiFetch("/api/counter/magic-link", {
      method: "POST",
      body: JSON.stringify({ customerId: view.customerId }),
    });
    const json = await res.json();
    if (!res.ok) return void toast.error("No se pudo generar el enlace");
    const { url } = unwrapApiData(json) as { url: string };
    await navigator.clipboard.writeText(url).catch(() => {});
    toast.success("Enlace copiado — mandáselo por WhatsApp");
  };

  return (
    <section className="mx-auto max-w-3xl space-y-5 p-1">
      <header className="flex items-center gap-3">
        <div className="rounded-lg bg-[var(--color-counter-50,#fff7ed)] p-2">
          <PackageCheck className="h-5 w-5 text-[var(--color-counter-600,#ea580c)]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">Mostrador</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Buscá a la persona · ver casillero · cobrar · entregar.</p>
        </div>
      </header>

      {!view && (
        <>
          <Card>
            <div className="flex gap-2">
              <Input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void doSearch()}
                placeholder="Nombre, tracking del carrier o número de casillero"
              />
              <Button onClick={() => void doSearch()} loading={busy} icon={<Search className="h-4 w-4" />}>
                Buscar
              </Button>
            </div>
          </Card>

          {results?.kind === "customers" && (
            <Card>
              <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
                {results.matches.length} coincidencia{results.matches.length === 1 ? "" : "s"}
              </p>
              <div className="space-y-1">
                {results.matches.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => void openCasillero(c.id)}
                    className="flex w-full items-center gap-3 rounded-md border border-[var(--color-border)] p-2 text-left text-sm hover:bg-[var(--color-surface-2,#f1f5f9)]"
                  >
                    <span className="font-mono text-xs">{c.code}</span>
                    <span className="flex-1">{c.displayName}</span>
                    {c.phone && <span className="text-xs text-[var(--color-text-soft)]">{c.phone}</span>}
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-soft)]" />
                  </button>
                ))}
              </div>
            </Card>
          )}
          {results?.kind === "empty" && (
            <p className="px-1 text-sm text-[var(--color-text-muted)]">Sin resultados. Probá con otro dato.</p>
          )}
          {results?.kind === "package" && !results.customerId && (
            <p className="px-1 text-sm text-[var(--color-text-muted)]">
              Ese paquete ({results.trackingCode}) todavía no tiene dueño asignado.
            </p>
          )}

          {recent.length > 0 && (
            <Card>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                <Clock className="h-3.5 w-3.5" /> Atendidos recién
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => void openCasillero(r.id)}
                    className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs hover:bg-[var(--color-surface-2,#f1f5f9)]"
                  >
                    <span className="font-mono">{r.code}</span> · {r.displayName.split(" ")[0]}
                  </button>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {view && (
        <>
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-[var(--color-text)]">{view.name}</p>
                <p className="font-mono text-sm text-[var(--color-text-muted)]">{view.casillero}</p>
                {view.hasCredit && (
                  <p className="mt-1 text-xs text-[var(--color-success-600,#16a34a)]">
                    Crédito disponible: {currency === "NIO" ? "C$" : "$"}
                    {view.creditAvailable.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <button onClick={() => setView(null)} className="text-xs text-[var(--color-text-soft)] hover:underline">
                  ← otra búsqueda
                </button>
                <button onClick={() => void magicLink()} className="flex items-center gap-1 text-xs text-[var(--color-primary-600)] hover:underline">
                  <Link2 className="h-3 w-3" /> enlace portal
                </button>
              </div>
            </div>
          </Card>

          <Card>
            <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">
              DISPONIBLES EN ESTA SUCURSAL ({view.available.length})
            </p>
            {view.available.length === 0 && (
              <p className="py-3 text-sm text-[var(--color-text-muted)]">Nada disponible para retirar acá.</p>
            )}
            <div className="space-y-1">
              {view.available.map((p) => (
                <label
                  key={p.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-md border p-2 text-sm ${
                    selected.has(p.id)
                      ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50,#eff6ff)]"
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} />
                  <span className="font-mono text-xs font-semibold">{p.trackingCode}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {p.weightLb?.toFixed(1) ?? "—"} lb · {p.mode === "SEA" ? "Marítimo" : "Aéreo"}
                  </span>
                  {p.billedOrder && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[0.65rem] font-semibold ${
                        p.billedOrder.status === "PAID"
                          ? "bg-[var(--color-success-100,#dcfce7)] text-[var(--color-success-700,#15803d)]"
                          : "bg-[var(--color-warning-100,#fef9c3)] text-[var(--color-warning-700,#a16207)]"
                      }`}
                    >
                      {p.billedOrder.status === "PAID" ? "pagado" : "facturado"}
                    </span>
                  )}
                  <span className="ml-auto font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
                    {p.amount ?? "—"}
                  </span>
                </label>
              ))}
            </div>
            {selected.size > 0 && (
              <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <span className="text-sm text-[var(--color-text-muted)]">
                  Seleccionado ({selected.size})
                </span>
                <span className="text-lg font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {currency === "NIO" ? "C$" : "$"}
                  {total.toFixed(2)}
                </span>
              </div>
            )}
          </Card>

          {selected.size > 0 && (
            <Card>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => void bill()} loading={busy} disabled={unbilled.length === 0} icon={<Printer className="h-4 w-4" />}>
                  Facturar ({unbilled.length})
                </Button>
                <Button
                  onClick={() => void collect()}
                  loading={busy}
                  disabled={selectedPkgs.every((p) => !p.billedOrder || p.billedOrder.status === "PAID")}
                  variant="secondary"
                  icon={<Wallet className="h-4 w-4" />}
                >
                  Cobrar
                </Button>
                <Button
                  onClick={() => setHandoverOpen(true)}
                  loading={busy}
                  variant="secondary"
                  icon={<PackageCheck className="h-4 w-4" />}
                >
                  Entregar
                </Button>
              </div>
              <p className="mt-2 text-xs text-[var(--color-text-soft)]">
                Cobrar y entregar son dos cosas. Se puede entregar sin cobro si el casillero tiene crédito; y
                pagar sin retirar.
                {unpaid.length > 0 && ` ${unpaid.length} paquete(s) seleccionado(s) sin pagar.`}
              </p>
            </Card>
          )}

          {(view.onTheWay.length > 0 || view.deliveredCount > 0) && (
            <div className="flex gap-4 px-1 text-xs text-[var(--color-text-muted)]">
              {view.onTheWay.length > 0 && <span>En camino: {view.onTheWay.length}</span>}
              {view.deliveredCount > 0 && <span>Entregados: {view.deliveredCount}</span>}
            </div>
          )}

          {handoverOpen && (
            <HandoverDialog
              customerId={view.customerId}
              packages={selectedPkgs}
              hasCredit={view.hasCredit}
              unpaidCount={unpaid.length}
              onClose={() => setHandoverOpen(false)}
              onDone={() => {
                setHandoverOpen(false);
                void openCasillero(view.customerId);
              }}
            />
          )}
        </>
      )}
    </section>
  );
}

function HandoverDialog({
  customerId,
  packages,
  hasCredit,
  unpaidCount,
  onClose,
  onDone,
}: {
  customerId: string;
  packages: Available[];
  hasCredit: boolean;
  unpaidCount: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [allowUnpaid, setAllowUnpaid] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await apiFetch("/api/counter/handover", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          packageIds: packages.map((p) => p.id),
          recipientName: name.trim(),
          recipientIdNumber: doc.trim(),
          allowUnpaid: unpaidCount > 0 ? allowUnpaid : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) return void toast.error(json.error?.message ?? "No se pudo entregar");
      toast.success(`${packages.length} paquete(s) entregado(s)`);
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center">
      <Card className="w-full max-w-md">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Entregar {packages.length} paquete(s)</h2>
          <button onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium text-[var(--color-text-muted)]">
            Nombre de quien retira
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </label>
          <label className="block text-xs font-medium text-[var(--color-text-muted)]">
            Cédula / documento
            <Input value={doc} onChange={(e) => setDoc(e.target.value)} className="mt-1" />
          </label>
          {unpaidCount > 0 && (
            <label className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
              <input type="checkbox" checked={allowUnpaid} onChange={(e) => setAllowUnpaid(e.target.checked)} disabled={!hasCredit} />
              Entregar sin cobrar ({unpaidCount} sin pagar){!hasCredit && " — el casillero no tiene crédito"}
            </label>
          )}
        </div>
        <Button
          onClick={() => void submit()}
          loading={busy}
          disabled={name.trim().length < 2 || doc.trim().length < 3 || (unpaidCount > 0 && !allowUnpaid)}
          className="mt-3 w-full"
        >
          Confirmar entrega
        </Button>
      </Card>
    </div>
  );
}
