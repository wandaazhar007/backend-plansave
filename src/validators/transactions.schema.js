import { z } from "zod";
import { sanitizeText } from "../utils/sanitize.js";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "date harus format YYYY-MM-DD");

const typeSchema = z.enum(["income", "expense"]);

export const createTransactionSchema = z
  .object({
    type: typeSchema,
    amountCents: z.coerce.number().int().min(0).max(1_000_000_000),
    currency: z.string().trim().min(3).max(6).default("USD"),
    category: z
      .string()
      .transform((v) => sanitizeText(v, { maxLen: 60 }) || "")
      .refine((v) => v.length >= 1, "category wajib diisi")
      .refine((v) => v.length <= 60, "category maksimal 60 karakter"),
    isDialysisRelated: z.coerce.boolean().default(false),
    date: isoDateSchema,
    note: z
      .string()
      .optional()
      .transform((v) => (v === undefined ? undefined : sanitizeText(v, { maxLen: 500 }))),
  })
  .strict();

export const updateTransactionSchema = createTransactionSchema.partial().strict();

export const transactionIdParamSchema = z
  .object({
    id: z.string().trim().min(1).max(128),
  })
  .strict();

export const listTransactionsQuerySchema = z
  .object({
    from: isoDateSchema.optional(),
    to: isoDateSchema.optional(),
    type: typeSchema.optional(),
    category: z.string().trim().min(1).max(60).optional(),
    dialysis: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === "true")),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().trim().min(1).optional(), // cursor = last transaction docId
  })
  .strict()
  .refine(
    (q) => {
      if (!q.from || !q.to) return true;
      return q.from <= q.to;
    },
    { message: "from tidak boleh lebih besar dari to", path: ["from"] }
  );