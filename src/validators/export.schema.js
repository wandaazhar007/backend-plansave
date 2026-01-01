import { z } from "zod";

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal harus format YYYY-MM-DD");

export const exportTransactionsQuerySchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
    format: z.enum(["csv", "xlsx"]).default("csv"),
  })
  .strict()
  .refine(
    (q) => q.from <= q.to,
    { message: "from tidak boleh lebih besar dari to", path: ["from"] }
  );