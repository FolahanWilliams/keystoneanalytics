import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = "confirmation" | "cancellation" | "payment_failed";

interface SubscriptionEmailRequest {
  email: string;
  displayName?: string;
  type: EmailType;
  tier?: string;
  periodEnd?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, type, tier = "Pro", periodEnd }: SubscriptionEmailRequest = await req.json();

    if (!email || !type) {
      return new Response(
        JSON.stringify({ error: "Email and type are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const name = displayName || "Trader";
    let subject: string;
    let htmlContent: string;

    switch (type) {
      case "confirmation":
        subject = `Welcome to Keystone Analytics ${tier}! 🚀`;
        htmlContent = getConfirmationEmail(name, tier);
        break;
      case "cancellation":
        subject = "Your Keystone Analytics Subscription Has Been Cancelled";
        htmlContent = getCancellationEmail(name, periodEnd);
        break;
      case "payment_failed":
        subject = "Action Required: Payment Failed for Keystone Analytics";
        htmlContent = getPaymentFailedEmail(name);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid email type" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
    }

    const emailResponse = await resend.emails.send({
      from: "Keystone Analytics <noreply@keystoneanalytics.org>",
      to: [email],
      subject,
      html: htmlContent,
    });

    console.log(`Subscription ${type} email sent:`, emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: `${type} email sent`, data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-subscription-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

function getConfirmationEmail(name: string, tier: string): string {
  const tierFeatures = tier === "Elite" 
    ? [
        "Unlimited AI-powered analysis",
        "Priority support",
        "Advanced technical indicators",
        "Unlimited watchlists & alerts",
        "Early access to new features",
      ]
    : [
        "AI-powered stock analysis",
        "Advanced charting tools",
        "Up to 5 watchlists",
        "Real-time market data",
        "Personal trading coach",
      ];

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, #111113 0%, #0a0a0b 100%); border: 1px solid #222; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #10b981; font-size: 28px; margin: 0;">Keystone Analytics</h1>
        </div>
        
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: 600;">${tier.toUpperCase()} MEMBER</span>
        </div>
        
        <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff; text-align: center;">Thank You, ${name}! 🎉</h2>
        
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          Your upgrade to ${tier} has been confirmed. You now have access to premium features that will help you make smarter trading decisions.
        </p>
        
        <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #10b981; font-size: 16px; margin: 0 0 16px 0;">Your ${tier} Benefits:</h3>
          <ul style="color: #a1a1aa; line-height: 1.8; margin: 0; padding-left: 20px;">
            ${tierFeatures.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://keystoneanalytics.org/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Start Exploring
          </a>
        </div>
        
        <p style="color: #71717a; font-size: 14px; line-height: 1.6; text-align: center;">
          Questions? Reply to this email or visit our <a href="https://keystoneanalytics.org/dashboard/settings" style="color: #10b981; text-decoration: none;">account settings</a>.
        </p>
        
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        
        <p style="color: #52525b; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Keystone Analytics. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

function getCancellationEmail(name: string, periodEnd?: string): string {
  const endDate = periodEnd ? new Date(periodEnd).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'the end of your billing period';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, #111113 0%, #0a0a0b 100%); border: 1px solid #222; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #10b981; font-size: 28px; margin: 0;">Keystone Analytics</h1>
        </div>
        
        <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff;">We're Sorry to See You Go, ${name}</h2>
        
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
          Your subscription has been cancelled. You'll continue to have access to premium features until <strong style="color: #f59e0b;">${endDate}</strong>.
        </p>
        
        <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #f59e0b; font-size: 16px; margin: 0 0 12px 0;">What happens next?</h3>
          <p style="color: #a1a1aa; line-height: 1.6; margin: 0;">
            After your access expires, your account will be downgraded to the free tier. You'll still be able to access basic features and your saved data.
          </p>
        </div>
        
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
          Changed your mind? You can resubscribe anytime to regain access to all premium features.
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://keystoneanalytics.org/pricing" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Resubscribe
          </a>
        </div>
        
        <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
          We'd love to hear your feedback. If there's anything we could have done better, please reply to this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        
        <p style="color: #52525b; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Keystone Analytics. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

function getPaymentFailedEmail(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0b; color: #ffffff; padding: 40px 20px; margin: 0;">
      <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(145deg, #111113 0%, #0a0a0b 100%); border: 1px solid #222; border-radius: 16px; padding: 40px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #10b981; font-size: 28px; margin: 0;">Keystone Analytics</h1>
        </div>
        
        <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff;">Payment Failed, ${name}</h2>
        
        <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
          We were unable to process your subscription payment. Please update your payment method to continue enjoying premium features.
        </p>
        
        <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
          <h3 style="color: #ef4444; font-size: 16px; margin: 0 0 12px 0;">⚠️ Action Required</h3>
          <p style="color: #a1a1aa; line-height: 1.6; margin: 0;">
            Your subscription is at risk of being cancelled. Please update your payment information as soon as possible to avoid losing access.
          </p>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="https://keystoneanalytics.org/dashboard/settings" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Update Payment Method
          </a>
        </div>
        
        <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
          If you believe this is an error or need assistance, please reply to this email.
        </p>
        
        <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
        
        <p style="color: #52525b; font-size: 12px; text-align: center;">
          © ${new Date().getFullYear()} Keystone Analytics. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);
