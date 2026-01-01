import { z } from "zod";

export const listAlertsQuerySchema = z
  .object({
    month: z.string().regex(/^\d{4}-\d{2}$/, "month harus format YYYY-MM").optional(),
  })
  .strict();

export const ackAlertSchema = z
  .object({
    alertId: z.string().trim().min(1).max(200),
  })
  .strict();