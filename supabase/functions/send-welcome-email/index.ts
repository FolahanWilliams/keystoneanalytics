import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  displayName?: string;
}

// HTML escape function to prevent injection
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Email validation
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // JWT Authentication check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { email, displayName }: WelcomeEmailRequest = await req.json();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize display name to prevent HTML injection
    const safeName = displayName ? escapeHtml(displayName.slice(0, 100)) : "Trader";

    const emailResponse = await resend.emails.send({
      from: "Keystone Analytics <noreply@keystoneanalytics.org>",
      to: [email],
      subject: "Welcome to Keystone Analytics - Let's Get Started!",
      html: `
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
              <p style="color: #71717a; margin-top: 8px; font-size: 14px;">Intelligent Market Analysis</p>
            </div>
            
            <h2 style="font-size: 22px; margin-bottom: 16px; color: #fff;">Welcome, ${safeName}! 🎉</h2>
            
            <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              You've just joined thousands of traders who use Keystone Analytics to make smarter, data-driven trading decisions. We're excited to have you on board!
            </p>
            
            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="color: #10b981; font-size: 16px; margin: 0 0 16px 0;">Here's what you can do:</h3>
              <ul style="color: #a1a1aa; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Access real-time market data & advanced charts</li>
                <li>Get AI-powered stock analysis and insights</li>
                <li>Use advanced technical indicators</li>
                <li>Chat with your personal trading coach</li>
                <li>Learn from our Trading Academy</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="https://keystoneanalytics.org/dashboard" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Open Dashboard
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
              Need help getting started? Check out our <a href="https://keystoneanalytics.org/academy" style="color: #10b981; text-decoration: none;">Trading Academy</a> for tutorials and guides, or reply to this email with any questions.
            </p>
            
            <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
            
            <p style="color: #52525b; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Keystone Analytics. All rights reserved.<br>
              <a href="https://keystoneanalytics.org/privacy" style="color: #52525b; text-decoration: none;">Privacy Policy</a> · 
              <a href="https://keystoneanalytics.org/terms" style="color: #52525b; text-decoration: none;">Terms of Service</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent", data: emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-welcome-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
