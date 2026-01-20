// Lightweight client-side cache utility for market data

import type { Candle, Quote } from "@/types/market";

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

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

// Helper to generate cache keys
export function cacheKey(...parts: (string | number)[]): string {
  return parts.join("::");
}

// =============================================================================
// Unified Market Data Cache Singleton
// =============================================================================

// TTL constants for different data types
const QUOTE_TTL = 60_000;      // 60 seconds for quotes (real-time data)
const CANDLE_TTL = 300_000;    // 5 minutes for candle data
const TECHNICAL_TTL = 120_000; // 2 minutes for technical indicators

class MarketDataCache {
  private quoteCache: DataCache<Quote[]>;
  private candleCache: DataCache<Candle[]>;
  private technicalCache: DataCache<Candle[]>;

  constructor() {
    this.quoteCache = new DataCache<Quote[]>(QUOTE_TTL);
    this.candleCache = new DataCache<Candle[]>(CANDLE_TTL);
    this.technicalCache = new DataCache<Candle[]>(TECHNICAL_TTL);
  }

  // Quote cache methods
  getQuotes(key: string): Quote[] | null {
    return this.quoteCache.get(key);
  }

  setQuotes(key: string, data: Quote[]): void {
    this.quoteCache.set(key, data);
  }

  isQuotesFresh(key: string): boolean {
    return this.quoteCache.isFresh(key);
  }

  // Candle cache methods
  getCandles(key: string): Candle[] | null {
    return this.candleCache.get(key);
  }

  setCandles(key: string, data: Candle[]): void {
    this.candleCache.set(key, data);
  }

  isCandlesFresh(key: string): boolean {
    return this.candleCache.isFresh(key);
  }

  // Technical indicator cache methods
  getTechnical(key: string): Candle[] | null {
    return this.technicalCache.get(key);
  }

  setTechnical(key: string, data: Candle[]): void {
    this.technicalCache.set(key, data);
  }

  isTechnicalFresh(key: string): boolean {
    return this.technicalCache.isFresh(key);
  }

  // Invalidate all cached data for a specific symbol
  invalidateSymbol(symbol: string): void {
    this.quoteCache.invalidatePattern(symbol);
    this.candleCache.invalidatePattern(symbol);
    this.technicalCache.invalidatePattern(symbol);
    console.log(`[MarketDataCache] Invalidated all cache for symbol: ${symbol}`);
  }

  // Force refresh - clears ALL cached data across all layers
  forceRefresh(): void {
    this.quoteCache.clear();
    this.candleCache.clear();
    this.technicalCache.clear();
    console.log("[MarketDataCache] All caches cleared");
  }
}

// Export singleton instance
export const marketDataCache = new MarketDataCache();
