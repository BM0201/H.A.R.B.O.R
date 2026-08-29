"use client";

import { Truck } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function DeliveryPage() {
  return (
    <RouteShell
      icon={Truck}
      title="Ultima milla"
      description="Ruta de entrega a domicilio: paradas, evidencia y cobro contra entrega."
      blockedBy="modelo Package + rendicion del repartidor (PASO R.4.3)"
      requires="delivery.lastmile"
    />
  );
}
