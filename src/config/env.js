import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(5014),

  // CORS allowlist: comma-separated origins
  CORS_ALLOWLIST: z.string().default(
    "https://plansave.com,https://app.plansave.com,https://admin.plansave.com"
  ),

  // Rate limit
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Tampilkan error env yang jelas, tanpa dump semua env
  console.error("[ENV] Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;