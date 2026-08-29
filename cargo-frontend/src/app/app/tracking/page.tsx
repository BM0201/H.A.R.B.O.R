"use client";

import { Radar } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function TrackingPage() {
  return (
    <RouteShell
      icon={Radar}
      title="Seguimiento"
      description="Consulta transversal del estado de un paquete por codigo de tracking o casillero."
      blockedBy="modelo Package + proyeccion de eventos (ADR-0005)"
      requires="tracking.view"
    />
  );
}
