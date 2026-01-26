// Shared utility for tier checking across edge functions
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export type SubscriptionTier = 'free' | 'pro' | 'elite';

// Premium fields that require paid subscription - grouped by category
export const PREMIUM_FUNDAMENTAL_FIELDS = [
  // Deep Valuation
  'priceToBook', 'priceToSales', 'evToEbitda',
  // Profitability Growth
  'epsGrowth', 'revenueGrowth', 'profitMargin', 'operatingMargin', 'grossMargin',
  // Financial Health
  'debtToEquity', 'currentRatio', 'quickRatio', 'interestCoverage',
  // Cash Flow
  'freeCashFlow', 'freeCashFlowYield', 'operatingCashFlow',
  // Returns
  'roe', 'roa', 'roic',
  // Analyst & Sentiment
  'analystRating', 'priceTarget', 'priceToTargetUpside', 'numberOfAnalysts',
] as const;

// Premium quote fields
export const PREMIUM_QUOTE_FIELDS = [
  'marketCap', 'pe', 'eps', 'volume', 'avgVolume', 'yearHigh', 'yearLow',
] as const;

/**
 * Get user subscription tier from database
 * Uses service role to bypass RLS on user_subscriptions table
 */
export async function getUserTier(userId: string): Promise<SubscriptionTier> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase credentials for tier check");
    return 'free';
  }
  
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
  
  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error("Error fetching user tier:", error.message);
    return 'free';
  }
  
  return (data?.tier as SubscriptionTier) || 'free';
}

/**
 * Check if user has access to premium features
 */
export function hasPremiumAccess(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'elite';
}

/**
 * Mask premium fields from data object for free tier users
 * Returns the data with null values for premium fields and a _premiumLocked array
 */
export function maskPremiumFields<T extends Record<string, any>>(
  data: T,
  tier: SubscriptionTier,
  premiumFields: readonly string[]
): T & { _premiumLocked?: string[] } {
  if (hasPremiumAccess(tier)) {
    return data;
  }
  
  const masked: Record<string, any> = { ...data, _premiumLocked: [] as string[] };
  
  for (const field of premiumFields) {
    if (field in masked && masked[field] !== undefined && masked[field] !== null) {
      masked[field] = null;
      (masked._premiumLocked as string[]).push(field);
    }
  }
  
  return masked as T & { _premiumLocked?: string[] };
}

/**
 * Mask premium fields in quote data
 */
export function maskQuoteFields<T extends Record<string, any>>(
  quote: T,
  tier: SubscriptionTier
): T {
  if (hasPremiumAccess(tier)) {
    return quote;
  }
  
  const masked = { ...quote };
  
  for (const field of PREMIUM_QUOTE_FIELDS) {
    if (field in masked) {
      masked[field as keyof T] = undefined as any;
    }
  }
  
  return masked;
}

/**
 * Extract user ID from auth header using JWT validation
 */
export async function getUserIdFromAuth(
  authHeader: string | null,
  supabaseUrl: string,
  anonKey: string
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  
  const supabaseClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  
  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error } = await supabaseClient.auth.getClaims(token);
  
  if (error || !claimsData?.claims) {
    return null;
  }
  
  return claimsData.claims.sub as string;
}
