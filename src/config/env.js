import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5014),

  CORS_ALLOWLIST: z.string().default(
    "https://plansave.com,https://app.plansave.com,https://admin.plansave.com"
  ),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),

  // Firebase Admin
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().min(1),

  // Optional (client config) — tidak dipakai backend saat ini
  FIREBASE_WEB_API_KEY: z.string().optional(),
  FIREBASE_WEB_AUTH_DOMAIN: z.string().optional(),
  FIREBASE_WEB_PROJECT_ID: z.string().optional(),
  FIREBASE_WEB_STORAGE_BUCKET: z.string().optional(),
  FIREBASE_WEB_MESSAGING_SENDER_ID: z.string().optional(),
  FIREBASE_WEB_APP_ID: z.string().optional(),
  FIREBASE_WEB_MEASUREMENT_ID: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("[ENV] Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;