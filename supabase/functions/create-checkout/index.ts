import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// In-memory rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration - stricter for checkout (5 requests per minute)
const RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 1000,
};

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const userLimit = rateLimitStore.get(userId);
  
  // Clean up expired entries periodically
  if (rateLimitStore.size > 1000) {
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }
  
  if (!userLimit || userLimit.resetTime < now) {
    rateLimitStore.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT.windowMs,
    });
    return {
      allowed: true,
      remaining: RATE_LIMIT.maxRequests - 1,
      resetIn: RATE_LIMIT.windowMs,
    };
  }
  
  if (userLimit.count >= RATE_LIMIT.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: userLimit.resetTime - now,
    };
  }
  
  userLimit.count++;
  return {
    allowed: true,
    remaining: RATE_LIMIT.maxRequests - userLimit.count,
    resetIn: userLimit.resetTime - now,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check rate limit for this user
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      logStep("Rate limit exceeded", { userId: user.id, resetIn: rateLimit.resetIn });
      return new Response(JSON.stringify({ 
        error: "Too many checkout attempts. Please try again later.",
        retryAfter: Math.ceil(rateLimit.resetIn / 1000),
      }), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(RATE_LIMIT.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
          "Retry-After": String(Math.ceil(rateLimit.resetIn / 1000)),
        },
        status: 429,
      });
    }

    logStep("Rate limit check passed", { remaining: rateLimit.remaining });

    const { priceId } = await req.json();
    if (!priceId) throw new Error("Price ID is required");
    logStep("Received price ID", { priceId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    
    // Rate limit headers for all responses
    const rateLimitHeaders = {
      "X-RateLimit-Limit": String(RATE_LIMIT.maxRequests),
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(Math.ceil(rateLimit.resetIn / 1000)),
    };
    
    // Check if customer already exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
      
      // Check if user already has an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        logStep("User already has active subscription - redirecting to portal");
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${req.headers.get("origin")}/dashboard/settings`,
        });
        return new Response(JSON.stringify({ url: portalSession.url, isPortal: true }), {
          headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const origin = req.headers.get("origin") || "https://pulseterminal.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=cancelled`,
      metadata: {
        user_id: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, ...rateLimitHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in create-checkout", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
