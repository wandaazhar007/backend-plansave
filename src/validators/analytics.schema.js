import { z } from "zod";

export const monthlyAnalyticsQuerySchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "month harus format YYYY-MM"),
  })
  .strict();

export const trendAnalyticsQuerySchema = z
  .object({
    months: z.coerce.number().int().min(1).max(24).default(6),
  })
  .strict();