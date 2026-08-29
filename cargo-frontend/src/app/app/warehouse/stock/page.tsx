"use client";

import { Boxes } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function StockPage() {
  return (
    <RouteShell
      icon={Boxes}
      title="Paquetes en bodega"
      description="Paquetes recibidos y aun no embarcados, por ubicacion y dias en bodega."
      blockedBy="modelo Package (§12 pasos 2-6)"
      requires="warehouse.view"
    />
  );
}
