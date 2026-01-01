// import { z } from "zod";

// export const listUsersQuerySchema = z
//   .object({
//     limit: z.coerce.number().int().min(1).max(100).default(20),
//     cursor: z.string().trim().min(1).optional(), // cursor = last user docId
//   })
//   .strict();

// export const userUidParamSchema = z
//   .object({
//     uid: z.string().trim().min(1).max(128),
//   })
//   .strict();





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

// Body ban/unban (optional)
const reasonSchema = z
  .string()
  .trim()
  .max(200, "reason maksimal 200 karakter")
  // sanitasi ringan tanpa dependensi tambahan (hindari HTML/script)
  .transform((v) => v.replace(/[<>]/g, ""))
  .optional();

export const banUserBodySchema = z
  .object({
    reason: reasonSchema,
  })
  .strict();

export const unbanUserBodySchema = z
  .object({
    reason: reasonSchema,
  })
  .strict();