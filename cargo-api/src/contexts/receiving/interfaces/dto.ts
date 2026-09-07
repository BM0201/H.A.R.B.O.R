/**
 * HARBOR PASO S — DTOs / validación de entrada del contexto `receiving`.
 */
import { z } from "zod";

const mode = z.enum(["AIR", "SEA"]);
const weightSource = z.enum(["SCALE", "MANUAL"]);
const inches = z.number().positive().max(200);

export const receivePackageSchema = z.object({
  rawBarcode: z.string().min(3).max(200),
  labelRecipientRaw: z.string().max(300).nullable().optional(),
  declaredMode: mode.nullable().optional(),
  originBranchId: z.string().cuid().nullable().optional(),
  declaredValue: z.number().min(0).max(1_000_000).nullable().optional(),
  weightOriginLb: z.number().positive().max(5000).nullable().optional(),
  lengthIn: inches.nullable().optional(),
  widthIn: inches.nullable().optional(),
  heightIn: inches.nullable().optional(),
  weightSource: weightSource.optional(),
  overrideModeMismatch: z.boolean().optional(),
});

export const scanPreviewSchema = z.object({
  rawBarcode: z.string().min(3).max(200),
  labelRecipientRaw: z.string().max(300).nullable().optional(),
});

export const assignOrphanSchema = z.object({
  customerId: z.string().cuid(),
  mode,
  note: z.string().max(500).nullable().optional(),
});

export const measureSchema = z.object({
  weightOriginLb: z.number().positive().max(5000),
  lengthIn: inches.nullable().optional(),
  widthIn: inches.nullable().optional(),
  heightIn: inches.nullable().optional(),
  weightSource,
});

export const measureCorrectionSchema = measureSchema.extend({
  reason: z.string().min(8).max(500),
});

export const queueCaptureSchema = z.object({
  offlineClientId: z.string().min(6).max(120),
  rawBarcode: z.string().min(3).max(200),
  labelRecipientRaw: z.string().max(300).nullable().optional(),
  declaredMode: mode.nullable().optional(),
  weightOriginLb: z.number().positive().max(5000).nullable().optional(),
  lengthIn: inches.nullable().optional(),
  widthIn: inches.nullable().optional(),
  heightIn: inches.nullable().optional(),
  weightSource: weightSource.optional(),
  photoKey: z.string().max(300).nullable().optional(),
  capturedAt: z.string().datetime(),
});

export const enqueueSchema = z.object({
  originBranchId: z.string().cuid().nullable().optional(),
  captures: z.array(queueCaptureSchema).min(1).max(200),
});

export type ReceivePackageDTO = z.infer<typeof receivePackageSchema>;
export type AssignOrphanDTO = z.infer<typeof assignOrphanSchema>;
export type MeasureDTO = z.infer<typeof measureSchema>;
export type EnqueueDTO = z.infer<typeof enqueueSchema>;
