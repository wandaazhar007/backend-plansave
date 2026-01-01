import { z } from "zod";
import { sanitizeText } from "../utils/sanitize.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD");

const typeSchema = z.enum(["income", "expense"]);
const scheduleSchema = z.enum(["monthly", "weekly", "custom"]);

const templateSchema = z
  .object({
    type: typeSchema,
    amountCents: z.coerce.number().int().min(0).max(1_000_000_000),
    category: z
      .string()
      .transform((v) => sanitizeText(v, { maxLen: 60 }) || "")
      .refine((v) => v.length >= 1, "category wajib diisi")
      .refine((v) => v.length <= 60, "category maksimal 60 karakter"),
    isDialysisRelated: z.coerce.boolean().default(false),
    note: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : sanitizeText(v, { maxLen: 500 }))),
  })
  .strict();

export const createRecurringSchema = z
  .object({
    template: templateSchema,
    schedule: scheduleSchema,
    intervalDays: z.coerce.number().int().min(1).max(365).optional(),
    startDate: isoDateSchema,
    nextRunDate: isoDateSchema.optional(), // default = startDate
    active: z.coerce.boolean().default(true),
  })
  .strict()
  .refine(
    (v) => (v.schedule === "custom" ? typeof v.intervalDays === "number" : true),
    { message: "intervalDays wajib untuk schedule=custom", path: ["intervalDays"] }
  );

export const updateRecurringSchema = z
  .object({
    template: templateSchema.optional(),
    schedule: scheduleSchema.optional(),
    intervalDays: z.coerce.number().int().min(1).max(365).optional(),
    startDate: isoDateSchema.optional(),
    nextRunDate: isoDateSchema.optional(),
    active: z.coerce.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => {
      if (v.schedule === "custom") return typeof v.intervalDays === "number";
      return true;
    },
    { message: "intervalDays wajib untuk schedule=custom", path: ["intervalDays"] }
  );

export const recurringIdParamSchema = z
  .object({ id: z.string().trim().min(1).max(128) })
  .strict();