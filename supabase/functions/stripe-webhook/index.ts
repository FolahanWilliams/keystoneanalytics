import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Map Stripe product IDs to subscription tiers
const PRODUCT_TIERS: Record<string, "free" | "pro" | "elite"> = {
  "prod_SSpbYRHWbpEd2q": "pro",
  "prod_SSpbrSdKTHLN3l": "elite",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get the signature from headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      logStep("ERROR: Missing stripe-signature header");
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get raw body for signature verification
    const body = await req.text();
    
    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
      logStep("Webhook signature verified", { eventType: event.type, eventId: event.id });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      logStep("ERROR: Webhook signature verification failed", { error: message });
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseAdmin, stripe, subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, stripe, subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (invoice.subscription) {
          logStep("Payment succeeded, refreshing subscription", { 
            subscriptionId: invoice.subscription,
            customerId: invoice.customer 
          });
          // Subscription updates are handled by subscription.updated event
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { 
          subscriptionId: invoice.subscription,
          customerId: invoice.customer,
          attemptCount: invoice.attempt_count
        });
        // Could send notification email here
        break;
      }

      default:
        logStep("Unhandled event type", { eventType: event.type });
    }

    return new Response(
      JSON.stringify({ received: true, eventType: event.type }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR: Webhook processing failed", { error: message });
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function handleSubscriptionChange(
  supabase: SupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription change", { 
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer
  });

  // Get customer email to find user
  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id;
  
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    logStep("ERROR: Customer not found or has no email", { customerId });
    return;
  }

  const email = customer.email;
  logStep("Found customer email", { email });

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("ERROR: Failed to list users", { error: userError.message });
    return;
  }

  const user = users.users.find((u: { email?: string }) => u.email === email);
  if (!user) {
    logStep("ERROR: No user found with email", { email });
    return;
  }

  logStep("Found user", { userId: user.id });

  // Determine tier from product
  const productId = subscription.items.data[0]?.price?.product;
  const productIdStr = typeof productId === "string" ? productId : (productId as { id?: string })?.id ?? "";
  const tier = PRODUCT_TIERS[productIdStr] || "free";

  // Only update if subscription is active
  if (subscription.status === "active" || subscription.status === "trialing") {
    const subscriptionData = {
      tier,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("user_subscriptions")
      .update(subscriptionData)
      .eq("user_id", user.id);

    if (upsertError) {
      logStep("ERROR: Failed to update subscription", { error: upsertError.message });
    } else {
      logStep("Subscription updated successfully", { userId: user.id, tier });
    }
  } else {
    logStep("Subscription not active, skipping update", { status: subscription.status });
  }
}

async function handleSubscriptionDeleted(
  supabase: SupabaseClient,
  stripe: Stripe,
  subscription: Stripe.Subscription
) {
  logStep("Processing subscription deletion", { 
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  // Get customer email
  const customerId = typeof subscription.customer === "string" 
    ? subscription.customer 
    : subscription.customer.id;
  
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted || !("email" in customer) || !customer.email) {
    logStep("ERROR: Customer not found or has no email", { customerId });
    return;
  }

  // Find user by email
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) {
    logStep("ERROR: Failed to list users", { error: userError.message });
    return;
  }

  const user = users.users.find((u: { email?: string }) => u.email === customer.email);
  if (!user) {
    logStep("ERROR: No user found with email", { email: customer.email });
    return;
  }

  // Downgrade to free tier
  const { error: updateError } = await supabase
    .from("user_subscriptions")
    .update({
      tier: "free",
      stripe_subscription_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    logStep("ERROR: Failed to downgrade subscription", { error: updateError.message });
  } else {
    logStep("Subscription downgraded to free", { userId: user.id });
  }
}
