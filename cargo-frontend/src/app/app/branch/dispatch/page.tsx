"use client";

import { PackageCheck } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function DispatchPage() {
  return (
    <RouteShell
      icon={PackageCheck}
      title="Entrega en mostrador"
      description="Entrega de un paquete disponible al cliente en el mostrador, con evidencia."
      blockedBy="modelo Package + maquina de estados (§12 paso 5)"
      requires="delivery.handover"
    />
  );
}
