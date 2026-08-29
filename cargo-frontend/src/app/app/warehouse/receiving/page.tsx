"use client";

import { Package } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function ReceivingPage() {
  return (
    <RouteShell
      icon={Package}
      title="Recepcion en origen"
      description="Registro de la llegada de un paquete a la bodega de Miami: identificacion contra pre-alerta, pesaje, medicion y fotografia."
      blockedBy="modelo Package (§12 pasos 2-6)"
      requires="package.receive"
    />
  );
}
