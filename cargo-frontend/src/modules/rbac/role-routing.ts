import type { Route } from "next";

export type AppRoleCode =
  | "SYSTEM_ADMIN"
  | "OWNER"
  | "MASTER"
  | "BRANCH_ADMIN"
  | "COUNTER"
  | "CASHIER"
  | "WAREHOUSE_ORIGIN"
  | "WAREHOUSE_DESTINATION"
  | "COURIER"
  | "ACCOUNTANT"
  | string;

export function isSystemAdminRole(roleCode: string, globalRoles?: readonly string[]) {
  return roleCode === "SYSTEM_ADMIN" || Boolean(globalRoles?.includes("SYSTEM_ADMIN"));
}

export function isOwnerRole(roleCode: string, globalRoles?: readonly string[]) {
  return roleCode === "OWNER" || Boolean(globalRoles?.includes("OWNER"));
}

export function isMasterRole(roleCode: string, globalRoles?: readonly string[]) {
  return roleCode === "MASTER" || Boolean(globalRoles?.includes("MASTER"));
}

/** Contador — rol global de solo-contabilidad. */
export function isAccountantRole(roleCode: string, globalRoles?: readonly string[]) {
  return roleCode === "ACCOUNTANT" || Boolean(globalRoles?.includes("ACCOUNTANT"));
}

/** OWNER has at least MASTER-level access */
export function isMasterOrAbove(roleCode: string, globalRoles?: readonly string[]) {
  return isMasterRole(roleCode, globalRoles) || isOwnerRole(roleCode, globalRoles) || isSystemAdminRole(roleCode, globalRoles);
}

export function resolveRoleHome(roleCode: AppRoleCode, globalRoles: readonly string[] = []): Route {
  if (isSystemAdminRole(roleCode, globalRoles)) return "/app/system-admin";
  if (isOwnerRole(roleCode, globalRoles)) return "/app/owner";
  if (isMasterRole(roleCode, globalRoles)) return "/app/master";
  // Contador: aterriza directamente en Finanzas & Contabilidad (única área que ve).
  if (isAccountantRole(roleCode, globalRoles)) return "/app/master/finance";

  // PASO R.5 — cada rol de sucursal aterriza en SU pantalla, no en un
  // /app/branch genérico con una caja registradora de ferretería.
  switch (roleCode) {
    case "BRANCH_ADMIN":
      return "/app/branch";
    case "CASHIER":
      return "/app/branch/cash";
    case "COUNTER":
      return "/app/branch/dispatch";
    case "WAREHOUSE_ORIGIN":
      return "/app/warehouse/receiving";
    case "WAREHOUSE_DESTINATION":
      return "/app/branch/arrivals";
    case "COURIER":
      return "/app/delivery";
  }

  // Red para roles desconocidos — no debería alcanzarse; deja rastro.
  if (typeof console !== "undefined") {
    console.warn(`[resolveRoleHome] rol sin home declarado: ${roleCode} → /app/branch`);
  }
  return "/app/branch";
}
