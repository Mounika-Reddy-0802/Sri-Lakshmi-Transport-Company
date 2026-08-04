// Environment configuration, validated once at startup with Zod.
//
// Global Rules: fail fast. If a required variable is missing or malformed the
// process exits immediately with the standard error envelope printed to stderr
// — never a stack trace, and never the value of a secret.
import dotenv from "dotenv";
import { z } from "zod";

// Loaded relative to the process CWD, which is `server/` for every npm script
// in this package. On Vercel there is no .env file and this is a no-op —
// the platform injects the variables directly.
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  MONGODB_URI: z
    .string()
    .min(1, "is required")
    .refine(
      (value) => value.startsWith("mongodb://") || value.startsWith("mongodb+srv://"),
      "must start with mongodb:// or mongodb+srv://",
    ),

  JWT_ACCESS_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().min(32, "must be at least 32 characters"),
  JWT_ACCESS_TTL: z.string().min(1).default("15m"),
  JWT_REFRESH_TTL: z.string().min(1).default("7d"),

  CLIENT_ORIGIN: z.string().min(1, "is required"),

  // Only needed from Phase 6 onward, so absent is valid until then.
  RAZORPAY_KEY_ID: z.string().optional().default(""),
  RAZORPAY_KEY_SECRET: z.string().optional().default(""),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      variable: issue.path.join("."),
      message: issue.message,
    }));
    process.stderr.write(
      `${JSON.stringify(
        {
          error: {
            code: "INVALID_ENVIRONMENT",
            message:
              "Server environment is invalid. Copy server/.env.example to server/.env and fill in the missing values.",
            details,
          },
        },
        null,
        2,
      )}\n`,
    );
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export const isProduction = env.NODE_ENV === "production";

/** True once Razorpay credentials are configured (Phase 6). */
export const hasPaymentCredentials = Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
