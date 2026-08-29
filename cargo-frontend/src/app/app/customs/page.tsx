"use client";

import { Stamp } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function CustomsPage() {
  return (
    <RouteShell
      icon={Stamp}
      title="Aduana"
      description="Declaracion y despacho aduanero de los embarques que llegan a Nicaragua."
      blockedBy="bloqueante #4 (alcance de aduana) + modelo Shipment"
      requires="customs.view"
    />
  );
}
