type Bucket = { count: number; resetAt: number };

export class MemoryRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  consume(key: string, now = Date.now()): { allowed: boolean; retryAfterSec?: number } {
    for (const [existing, bucket] of this.buckets) {
      if (bucket.resetAt <= now) this.buckets.delete(existing);
    }
    if (this.buckets.size >= this.maxKeys && !this.buckets.has(key)) {
      return { allowed: false, retryAfterSec: Math.ceil(this.windowMs / 1000) };
    }
    const bucket = this.buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return { allowed: true };
    }
    if (bucket.count >= this.limit) {
      return {
        allowed: false,
        retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      };
    }
    bucket.count += 1;
    return { allowed: true };
  }
}
