"use client";

import { Layers } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function ConsolidationPage() {
  return (
    <RouteShell
      icon={Layers}
      title="Consolidados"
      description="Agrupacion de paquetes en un consolidado listo para asignar a un embarque."
      blockedBy="modelos Package y Shipment (§12 pasos 2-6)"
      requires="package.consolidate"
    />
  );
}
