"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Warehouse, Plane, Ship, Stamp, MapPin, Wallet, ShieldAlert, PackageOpen, Truck } from "lucide-react";
import { apiFetch, unwrapApiData } from "@/lib/client/api";

/**
 * HARBOR PASO U.4 — Panorama LOGÍSTICO. El dinero no desaparece (movimiento del
 * día se conserva) pero deja de ser lo primero: lo primero es dónde están los
 * paquetes.
 */

const money = (n: number) => `$${n.toFixed(2)}`;

type MasterOverview = {
  hubDoral: { packages: number; chargeableLb: number; oldestDays: number };
  inTransit: { mode: string; count: number }[];
  inCustoms: { packages: number; oldestDays: number };
  readyForPickup: { branchId: string | null; branchName: string; count: number }[];
  movementToday: number;
  unconfirmedCustody: number;
};

export function LogisticsOverviewMaster() {
  const [data, setData] = useState<MasterOverview | null>(null);
  useEffect(() => {
    apiFetch("/api/master/logistics-overview")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setData(unwrapApiData(j) as MasterOverview))
      .catch(() => {});
  }, []);
  if (!data) return null;

  const transitTotal = data.inTransit.reduce((a, m) => a + m.count, 0);
  const readyTotal = data.readyForPickup.reduce((a, b) => a + b.count, 0);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <Tile
        icon={Warehouse}
        label="Hub Doral"
        value={`${data.hubDoral.packages} paq`}
        sub={`${data.hubDoral.chargeableLb.toFixed(0)} lb facturable${data.hubDoral.oldestDays > 0 ? ` · +viejo ${data.hubDoral.oldestDays}d` : ""}`}
        tone={data.hubDoral.oldestDays >= 14 ? "warning" : "default"}
      />
      <Tile
        icon={transitTotal && data.inTransit[0]?.mode === "SEA" ? Ship : Plane}
        label="En tránsito"
        value={`${transitTotal}`}
        sub={data.inTransit.map((m) => `${m.mode === "SEA" ? "mar" : "aéreo"} ${m.count}`).join(" · ") || "—"}
      />
      <Tile
        icon={Stamp}
        label="En aduana"
        value={`${data.inCustoms.packages}`}
        sub={data.inCustoms.oldestDays > 0 ? `+ viejo detenido ${data.inCustoms.oldestDays}d` : "—"}
        tone={data.inCustoms.oldestDays >= 5 ? "warning" : "default"}
      />
      <Tile
        icon={MapPin}
        label="Listos para retiro"
        value={`${readyTotal}`}
        sub={data.readyForPickup.map((b) => `${b.branchName}: ${b.count}`).join(" · ") || "—"}
      />
      <Tile icon={Wallet} label="Movimiento del día" value={money(data.movementToday)} sub="cobrado hoy" />
      <Tile
        icon={ShieldAlert}
        label="Custodia sin confirmar"
        value={`${data.unconfirmedCustody}`}
        sub="saldos CUSTODY abiertos"
        tone={data.unconfirmedCustody > 0 ? "warning" : "default"}
        href="/app/master/treasury"
      />
    </div>
  );
}

type BranchOverview = {
  arrivalsToday: number;
  availableForPickup: number;
  deliveredToday: number;
  pendingApprovals: number;
  collectedToday: number;
};

export function LogisticsOverviewBranch({ branchId }: { branchId: string }) {
  const [data, setData] = useState<BranchOverview | null>(null);
  useEffect(() => {
    apiFetch(`/api/branch/logistics-overview?branchId=${branchId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setData(unwrapApiData(j) as BranchOverview))
      .catch(() => {});
  }, [branchId]);
  if (!data) return null;

  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <Tile icon={PackageOpen} label="Llegadas hoy" value={`${data.arrivalsToday}`} sub="disponibles nuevas" />
      <Tile icon={MapPin} label="Para retiro" value={`${data.availableForPickup}`} sub="en esta sucursal" href="/app/branch/dispatch" />
      <Tile icon={Truck} label="Entregados hoy" value={`${data.deliveredToday}`} sub="retiros del día" />
      <Tile icon={ShieldAlert} label="Aprobaciones" value={`${data.pendingApprovals}`} sub="pendientes" tone={data.pendingApprovals > 0 ? "warning" : "default"} />
      <Tile icon={Wallet} label="Cobros hoy" value={money(data.collectedToday)} sub="flete cobrado" />
    </div>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
  tone = "default",
  href,
}: {
  icon: typeof Warehouse;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "warning";
  href?: string;
}) {
  const body = (
    <div
      className="rounded-lg border p-3"
      style={{
        borderColor: tone === "warning" ? "var(--color-warning-300, #fcd34d)" : "var(--color-border)",
        background: tone === "warning" ? "var(--color-warning-50, #fffbeb)" : "var(--color-surface)",
      }}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 text-lg font-bold text-[var(--color-text)]" style={{ fontVariantNumeric: "tabular-nums" }}>
        {value}
      </div>
      <div className="text-[11px] text-[var(--color-text-soft)]">{sub}</div>
    </div>
  );
  return href ? (
    <Link href={href as never} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}
