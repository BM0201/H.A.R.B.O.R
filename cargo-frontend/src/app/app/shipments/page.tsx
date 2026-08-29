"use client";

import { Ship } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function ShipmentsPage() {
  return (
    <RouteShell
      icon={Ship}
      title="Embarques"
      description="Embarques aereos y maritimos: carrier, AWB/BL, contenedor, ETD/ETA y prorrateo de costo."
      blockedBy="modelo Shipment (§12 pasos 2-6)"
      requires="shipment.view"
    />
  );
}
