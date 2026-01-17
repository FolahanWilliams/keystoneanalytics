import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

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

// Initialize Resend for sending emails
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

async function sendSubscriptionEmail(
  email: string,
  displayName: string | null,
  type: "confirmation" | "cancellation" | "payment_failed",
  tier?: string,
  periodEnd?: string
) {
  const name = displayName || "Trader";
  let subject: string;
  let htmlContent: string;

  switch (type) {
    case "confirmation":
      subject = `Welcome to Keystone Analytics ${tier}! 🚀`;
      htmlContent = getConfirmationEmailHtml(name, tier || "Pro");
      break;
    case "cancellation":
      subject = "Your Keystone Analytics Subscription Has Been Cancelled";
      htmlContent = getCancellationEmailHtml(name, periodEnd);
      break;
    case "payment_failed":
      subject = "Action Required: Payment Failed for Keystone Analytics";
      htmlContent = getPaymentFailedEmailHtml(name);
      break;
    default:
      logStep("ERROR: Invalid email type", { type });
      return;
  }

  try {
    const emailResponse = await resend.emails.send({
      from: "Keystone Analytics <noreply@keystoneanalytics.org>",
      to: [email],
      subject,
      html: htmlContent,
    });
    logStep(`Subscription ${type} email sent`, { email, response: emailResponse });
  } catch (error) {
    logStep(`ERROR: Failed to send ${type} email`, { email, error: error instanceof Error ? error.message : "Unknown" });
  }
}

function getConfirmationEmailHtml(name: string, tier: string): string {
  const tierFeatures = tier === "Elite" 
    ? ["Unlimited AI-powered analysis", "Priority support", "Advanced technical indicators", "Unlimited watchlists & alerts", "Early access to new features"]
    : ["AI-powered stock analysis", "Advanced charting tools", "Up to 5 watchlists", "Real-time market data", "Personal trading coach"];

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, #111113 0%, #0a0a0b 100%); border: 1px solid #222; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;"><h1 style="color: #10b981; font-size: 28px; margin: 0;">Keystone Analytics</h1></div>
        <div style="text-align: center; margin-bottom: 24px;"><span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">${tier.toUpperCase()} MEMBER</span></div>
        <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff; text-align: center;">Thank You, ${name}! 🎉</h2>
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; text-align: center;">Your upgrade to ${tier} has been confirmed. You now have access to premium features that will help you make smarter trading decisions.</p>
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #10b981; font-size: 16px; margin: 0 0 16px 0;">Your ${tier} Benefits:</h3>
          <ul style="color: #a1a1aa; line-height: 1.8; margin: 0; padding-left: 20px;">${tierFeatures.map(f => `<li>${f}</li>`).join('')}</ul>
        </div>
        <div style="text-align: center; margin: 32px 0;"><a href="https://keystoneanalytics.org/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Start Exploring</a></div>
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        <p style="color: #52525b; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Keystone Analytics. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function getCancellationEmailHtml(name: string, periodEnd?: string): string {
  const endDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'the end of your billing period';
  
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, #111113 0%, #0a0a0b 100%); border: 1px solid #222; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;"><h1 style="color: #10b981; font-size: 28px; margin: 0;">Keystone Analytics</h1></div>
        <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff;">We're Sorry to See You Go, ${name}</h2>
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">Your subscription has been cancelled. You'll continue to have access to premium features until <strong style="color: #f59e0b;">${endDate}</strong>.</p>
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #f59e0b; font-size: 16px; margin: 0 0 12px 0;">What happens next?</h3>
          <p style="color: #a1a1aa; line-height: 1.6; margin: 0;">After your access expires, your account will be downgraded to the free tier. You'll still be able to access basic features and your saved data.</p>
        </div>
        <div style="text-align: center; margin: 32px 0;"><a href="https://keystoneanalytics.org/pricing" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Resubscribe</a></div>
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        <p style="color: #52525b; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Keystone Analytics. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

function getPaymentFailedEmailHtml(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, #111113 0%, #0a0a0b 100%); border: 1px solid #222; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;"><h1 style="color: #10b981; font-size: 28px; margin: 0;">Keystone Analytics</h1></div>
        <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff;">Payment Failed, ${name}</h2>
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">We were unable to process your subscription payment. Please update your payment method to continue enjoying premium features.</p>
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #ef4444; font-size: 16px; margin: 0 0 12px 0;">⚠️ Action Required</h3>
          <p style="color: #a1a1aa; line-height: 1.6; margin: 0;">Your subscription is at risk of being cancelled. Please update your payment information as soon as possible.</p>
        </div>
        <div style="text-align: center; margin: 32px 0;"><a href="https://keystoneanalytics.org/dashboard/settings" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Update Payment Method</a></div>
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        <p style="color: #52525b; font-size: 12px; text-align: center;">© ${new Date().getFullYear()} Keystone Analytics. All rights reserved.</p>
      </div>
    </body>
    </html>
  `;
}

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
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseAdmin, stripe, subscription, true);
        break;
      }
      
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseAdmin, stripe, subscription, false);
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
        
        // Send payment failed email
        if (invoice.customer_email) {
          await sendSubscriptionEmail(
            invoice.customer_email,
            invoice.customer_name || null,
            "payment_failed"
          );
        }
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
  subscription: Stripe.Subscription,
  isNew: boolean
) {
  logStep("Processing subscription change", { 
    subscriptionId: subscription.id,
    status: subscription.status,
    customerId: subscription.customer,
    isNew
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

  // Get display name from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

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
      
      // Send confirmation email only for new subscriptions
      if (isNew) {
        await sendSubscriptionEmail(
          email,
          profile?.display_name || customer.name || null,
          "confirmation",
          tier.charAt(0).toUpperCase() + tier.slice(1)
        );
      }
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

  // Get display name from profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

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
    
    // Send cancellation email
    await sendSubscriptionEmail(
      customer.email,
      profile?.display_name || customer.name || null,
      "cancellation",
      undefined,
      new Date(subscription.current_period_end * 1000).toISOString()
    );
  }
}
