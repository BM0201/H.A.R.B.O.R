"use client";

import { PackageOpen } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function ArrivalsPage() {
  return (
    <RouteShell
      icon={PackageOpen}
      title="Llegada y distribucion"
      description="Descarga de un embarque en destino, verificacion y distribucion a sucursales."
      blockedBy="modelos Shipment y Package (§12 pasos 2-6)"
      requires="arrival.receive"
    />
  );
}
