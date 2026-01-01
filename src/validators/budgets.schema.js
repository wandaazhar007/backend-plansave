import { z } from "zod";
import { sanitizeText } from "../utils/sanitize.js";

const monthParamSchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "month harus format YYYY-MM"),
  })
  .strict();

const categoryLimitSchema = z
  .object({
    category: z
      .string()
      .transform((v) => sanitizeText(v, { maxLen: 60 }) || "")
      .refine((v) => v.length >= 1, "category wajib diisi")
      .refine((v) => v.length <= 60, "category maksimal 60 karakter"),
    limitCents: z.coerce.number().int().min(0).max(1_000_000_000),
  })
  .strict();

export const budgetMonthParamSchema = monthParamSchema;

export const upsertBudgetSchema = z
  .object({
    overallLimitCents: z.coerce.number().int().min(0).max(1_000_000_000),
    categoryLimits: z.array(categoryLimitSchema).default([]),
  })
  .strict()
  .refine(
    (v) => {
      // pastikan category unik (case-insensitive)
      const seen = new Set();
      for (const item of v.categoryLimits) {
        const key = item.category.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
      }
      return true;
    },
    { message: "categoryLimits memiliki category duplikat", path: ["categoryLimits"] }
  );