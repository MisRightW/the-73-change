import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type DailyScope = "run" | "import";
type LocalEntry = { count: number; resetAt: number };
const globalForRateLimit = globalThis as unknown as { localRateLimit?: Map<string, LocalEntry> };
const localRateLimit = globalForRateLimit.localRateLimit ?? new Map<string, LocalEntry>();
if (process.env.NODE_ENV !== "production") globalForRateLimit.localRateLimit = localRateLimit;

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN ? Redis.fromEnv() : null;
const distributedLimiters = redis ? {
  run: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(20, "24 h"), prefix: "the73:run", analytics: false }),
  import: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, "24 h"), prefix: "the73:import", analytics: false }),
  email: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(1, "60 s"), prefix: "the73:email", analytics: false }),
  emailIp: new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(10, "1 h"), prefix: "the73:email-ip", analytics: false })
} : null;

const limits: Record<DailyScope, number> = { run: 20, import: 10 };

export async function takeDailyLimit(scope: DailyScope, userId: string) {
  if (distributedLimiters) {
    const result = await distributedLimiters[scope].limit(userId);
    return { allowed: result.success, remaining: result.remaining, reset: result.reset, distributed: true };
  }
  const key = `${scope}:${userId}`; const now = Date.now(); const nextMidnight = new Date(); nextMidnight.setHours(24, 0, 0, 0);
  const existing = localRateLimit.get(key); const entry = existing && existing.resetAt > now ? existing : { count: 0, resetAt: nextMidnight.getTime() };
  if (entry.count >= limits[scope]) return { allowed: false, remaining: 0, reset: entry.resetAt, distributed: false };
  entry.count += 1; localRateLimit.set(key, entry);
  return { allowed: true, remaining: limits[scope] - entry.count, reset: entry.resetAt, distributed: false };
}

export async function takeEmailCodeLimit(scope: "email" | "emailIp", identifier: string) {
  if (distributedLimiters) {
    const result = await distributedLimiters[scope].limit(identifier);
    return { allowed: result.success, reset: result.reset, distributed: true };
  }
  const now = Date.now(); const duration = scope === "email" ? 60_000 : 60 * 60 * 1000; const limit = scope === "email" ? 1 : 10;
  const key = `${scope}:${identifier}`; const existing = localRateLimit.get(key); const entry = existing && existing.resetAt > now ? existing : { count: 0, resetAt: now + duration };
  if (entry.count >= limit) return { allowed: false, reset: entry.resetAt, distributed: false };
  entry.count += 1; localRateLimit.set(key, entry);
  return { allowed: true, reset: entry.resetAt, distributed: false };
}
