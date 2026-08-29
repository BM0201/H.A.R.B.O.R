import { z } from "zod";

/** Valid expense categories matching Prisma enum ExpenseCategory */
export const EXPENSE_CATEGORIES = [
  "PAYROLL",
  "UTILITIES",
  "RENT",
  "FOOD",
  "MAINTENANCE",
  "MARKETING",
  "TAXES",
  "OTHER",
  "FREIGHT_PURCHASE",
  "CUSTOMS_FEES",
  "WAREHOUSE_ORIGIN",
  "LAST_MILE",
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
  PAYROLL: "Personal / Nómina",
  UTILITIES: "Servicios (Agua, Luz, Internet)",
  RENT: "Renta / Alquiler",
  FOOD: "Alimentación",
  MAINTENANCE: "Mantenimiento",
  MARKETING: "Publicidad / Marketing",
  TAXES: "Impuestos (Alcaldía / DGI)",
  OTHER: "Otros",
  FREIGHT_PURCHASE: "Compra de flete al carrier",
  CUSTOMS_FEES: "Aduana / almacenaje portuario",
  WAREHOUSE_ORIGIN: "Bodega en el exterior",
  LAST_MILE: "Última milla / reparto local",
};

export const createExpenseSchema = z.object({
  branchId: z.string().min(1, "Sucursal es requerida"),
  category: z.enum(EXPENSE_CATEGORIES, { message: "Categoría inválida" }),
  description: z.string().min(1, "Descripción es requerida").max(200),
  amount: z.number().positive("El monto debe ser mayor a 0"),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

export const updateExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().optional(),
  isActive: z.boolean().optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().nullable().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
