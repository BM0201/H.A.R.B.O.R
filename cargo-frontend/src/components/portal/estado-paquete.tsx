import {
  PackageCheck,
  Warehouse,
  Boxes,
  Plane,
  Ship,
  Stamp,
  MapPin,
  CheckCircle2,
  Undo2,
  AlertTriangle,
  Clock,
  type LucideIcon,
} from "lucide-react";

/**
 * HARBOR PASO C / U — `<EstadoPaquete>`: la etapa de un paquete SIEMPRE como
 * color + ícono + etiqueta (nunca color solo — PRODUCT.md accesibilidad).
 */
type StageStyle = { label: string; icon: LucideIcon; fg: string; bg: string };

const STAGES: Record<string, StageStyle> = {
  PRE_ALERTED: { label: "Pre-alertado", icon: Clock, fg: "#57534E", bg: "#F5F5F4" },
  RECEIVED_ORIGIN: { label: "Recibido en Doral", icon: Warehouse, fg: "#1D4ED8", bg: "#EFF6FF" },
  ORPHAN: { label: "En verificación", icon: AlertTriangle, fg: "#B45309", bg: "#FFFBEB" },
  CONSOLIDATED: { label: "Consolidado", icon: Boxes, fg: "#6D28D9", bg: "#F5F3FF" },
  IN_TRANSIT: { label: "En tránsito", icon: Plane, fg: "#0E7490", bg: "#ECFEFF" },
  IN_CUSTOMS: { label: "En aduana", icon: Stamp, fg: "#B45309", bg: "#FFFBEB" },
  AVAILABLE: { label: "Listo para retirar", icon: MapPin, fg: "#047857", bg: "#ECFDF5" },
  DELIVERED: { label: "Entregado", icon: CheckCircle2, fg: "#3F6212", bg: "#F7FEE7" },
  RETURNED: { label: "Devuelto", icon: Undo2, fg: "#57534E", bg: "#F5F5F4" },
  LOST: { label: "Extraviado", icon: AlertTriangle, fg: "#B91C1C", bg: "#FEF2F2" },
  DAMAGED: { label: "Con novedad", icon: AlertTriangle, fg: "#B91C1C", bg: "#FEF2F2" },
};

export function EstadoPaquete({
  status,
  mode,
  size = "md",
}: {
  status: string;
  mode?: string;
  size?: "sm" | "md";
}) {
  const s = STAGES[status] ?? { label: status, icon: PackageCheck, fg: "#57534E", bg: "#F5F5F4" };
  const Icon = status === "IN_TRANSIT" && mode === "SEA" ? Ship : s.icon;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: size === "sm" ? "2px 8px" : "4px 10px",
        borderRadius: 999,
        background: s.bg,
        color: s.fg,
        fontSize: size === "sm" ? "0.72rem" : "0.8rem",
        fontWeight: 600,
        lineHeight: 1.2,
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={size === "sm" ? 13 : 15} strokeWidth={2.2} aria-hidden />
      {s.label}
    </span>
  );
}

export function stageIcon(status: string, mode?: string): LucideIcon {
  if (status === "IN_TRANSIT" && mode === "SEA") return Ship;
  return STAGES[status]?.icon ?? PackageCheck;
}
