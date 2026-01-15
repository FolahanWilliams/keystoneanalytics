import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialExpiryRequest {
  userId?: string;
  daysRemaining?: number;
  sendToAll?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, daysRemaining = 3, sendToAll = false }: TrialExpiryRequest = await req.json();

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let usersToNotify: { email: string; displayName: string | null }[] = [];

    if (sendToAll) {
      // Find users whose trial is expiring soon
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + daysRemaining);
      
      const { data: subscriptions, error: subError } = await supabaseAdmin
        .from("user_subscriptions")
        .select("user_id, current_period_end")
        .eq("tier", "free")
        .lte("current_period_end", expiryDate.toISOString())
        .gte("current_period_end", new Date().toISOString());

      if (subError) {
        console.error("Error fetching subscriptions:", subError);
        throw subError;
      }

      for (const sub of subscriptions || []) {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(sub.user_id);
        if (userData?.user?.email) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("display_name")
            .eq("user_id", sub.user_id)
            .single();
          
          usersToNotify.push({
            email: userData.user.email,
            displayName: profile?.display_name || null,
          });
        }
      }
    } else if (userId) {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
      if (userData?.user?.email) {
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("display_name")
          .eq("user_id", userId)
          .single();
        
        usersToNotify.push({
          email: userData.user.email,
          displayName: profile?.display_name || null,
        });
      }
    }

    const results = [];
    const pricingUrl = `${Deno.env.get("SUPABASE_URL")?.replace('.supabase.co', '')}/pricing`;

    for (const user of usersToNotify) {
      const name = user.displayName || "Trader";
      
      const emailResponse = await resend.emails.send({
        from: "Pulse Terminal <noreply@resend.dev>",
        to: [user.email],
        subject: `Your Pulse Terminal trial expires in ${daysRemaining} days`,
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
                <h1 style="color: #10b981; font-size: 24px; margin: 0;">Pulse Terminal</h1>
              </div>
              
              <h2 style="font-size: 20px; margin-bottom: 16px; color: #fff;">Hi ${name}, Your Trial is Ending Soon</h2>
              
              <p style="color: #a1a1aa; line-height: 1.6; margin-bottom: 24px;">
                Your free trial of Pulse Terminal will expire in <strong style="color: #f59e0b;">${daysRemaining} days</strong>. Don't lose access to:
              </p>
              
              <ul style="color: #a1a1aa; line-height: 1.8; margin-bottom: 24px; padding-left: 20px;">
                <li>Real-time market data & charts</li>
                <li>AI-powered stock analysis</li>
                <li>Advanced technical indicators</li>
                <li>Personal trading coach</li>
              </ul>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://pulseterminal.lovable.app/pricing" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Upgrade to Pro
                </a>
              </div>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6;">
                Upgrade now and get unlimited access to all premium features. Questions? Reply to this email and we'll be happy to help.
              </p>
              
              <hr style="border: none; border-top: 1px solid #222; margin: 32px 0;">
              
              <p style="color: #52525b; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Pulse Terminal. All rights reserved.
              </p>
            </div>
          </body>
          </html>
        `,
      });

      results.push({ email: user.email, result: emailResponse });
      console.log(`Trial expiry email sent to ${user.email}:`, emailResponse);
    }

    return new Response(
      JSON.stringify({ success: true, sent: results.length, results }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-trial-expiry:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
