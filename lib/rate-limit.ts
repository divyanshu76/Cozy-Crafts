/**
 * In-memory rate limiter — placeholder ONLY.
 *
 * ⚠️  NOT production-safe on Vercel serverless: state resets between cold starts
 *     and is NOT shared across function instances.
 *
 * TODO: Replace with @upstash/ratelimit + Upstash Redis before launch:
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 */
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  key: string,
  { max, windowSeconds }: { max: number; windowSeconds: number }
): Promise<boolean> {
  const now = Date.now();
  const record = attempts.get(key);

  if (!record || now > record.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= max) return false;

  record.count += 1;
  return true;
}
