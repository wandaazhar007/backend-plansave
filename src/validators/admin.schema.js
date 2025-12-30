import { z } from "zod";

export const listUsersQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    cursor: z.string().trim().min(1).optional(), // cursor = last user docId
  })
  .strict();

export const userUidParamSchema = z
  .object({
    uid: z.string().trim().min(1).max(128),
  })
  .strict();