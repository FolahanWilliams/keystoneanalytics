// Lightweight client-side cache utility for market data

export interface CacheEntry<T> {
  data: T;
  ts: number;
}

export class DataCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number = 60_000) {
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.ts > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  set(key: string, data: T): void {
    this.cache.set(key, { data, ts: Date.now() });
  }

  isFresh(key: string): boolean {
    const entry = this.cache.get(key);
    return !!entry && Date.now() - entry.ts < this.ttlMs;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Helper to generate cache keys
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join("::");
}
