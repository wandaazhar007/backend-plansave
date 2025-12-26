import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(5012),

  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),

  VERIFY_ID_TOKEN_REVOKED: z
    .string()
    .default("false")
    .transform((v) => v === "true"),

  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  FIREBASE_SERVICE_ACCOUNT_BASE64: z.string().optional(),

  FIREBASE_STORAGE_BUCKET: z.string().min(3),

  RECEIPT_SIGNED_URL_TTL_MINUTES: z.coerce
    .number()
    .int()
    .positive()
    .default(60),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;