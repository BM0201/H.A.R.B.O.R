"use client";

import { Users } from "lucide-react";
import { RouteShell } from "@/components/layout/route-shell";

// PASO R.5 — cascaron de rutas. El estado vacio es documentacion (ver RouteShell).
export default function CustomersPage() {
  return (
    <RouteShell
      icon={Users}
      title="Casilleros"
      description="Directorio de clientes: numero de casillero, direcciones, tier y vista 360."
      blockedBy="Fase 0.3 (Customer/Casillero) + Fase 0.8 (vista 360)"
      requires="customer.view"
    />
  );
}
