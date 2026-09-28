import "server-only";
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  APP_URL: z.string().url(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/**
 * Validated server-side environment. Validation is lazy so `next build` works
 * without production secrets; the first request that needs them fails loudly
 * if anything is missing or malformed.
 */
export function env(): ServerEnv {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid or missing environment variables: ${fields}`);
    }
    cached = parsed.data;
  }
  return cached;
}
