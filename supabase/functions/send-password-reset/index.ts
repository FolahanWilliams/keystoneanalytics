import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectTo: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectTo }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Generate password reset link
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    if (resetError) {
      console.error("Error generating reset link:", resetError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // The action_link is in data.properties.action_link
    const resetLink = data?.properties?.action_link;
    
    console.log("Generated reset link data:", JSON.stringify(data, null, 2));
    
    if (!resetLink) {
      console.error("No action_link in response. Full data:", data);
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, a reset email has been sent." }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send email via Resend
    const emailResponse = await resend.emails.send({
      from: "Keystone Analytics <noreply@keystoneanalytics.org>",
      to: [email],
      subject: "Reset Your Password - Keystone Analytics",
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
            </div>
            
            <h2 style="font-size: 20px; margin-bottom: 16px; color: #fff;">Reset Your Password</h2>
            
            <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
              We received a request to reset your password. Click the button below to create a new password. This link will expire in 1 hour.
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
            
            <p style="color: #52525b; font-size: 12px; text-align: center;">
              © ${new Date().getFullYear()} Keystone Analytics. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Password reset email sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
