import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  espaco_id: string;
  email: string;
  invited_name?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify auth
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabaseUser.auth.getUser(token);
    
    if (claimsError || !claims?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.user.id;

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { espaco_id, email, invited_name }: InvitationRequest = await req.json();

    if (!espaco_id || !email) {
      return new Response(
        JSON.stringify({ error: "espaco_id and email are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is mentor of this espaco or admin
    const { data: espaco, error: espacoError } = await supabase
      .from("espacos")
      .select("id, name, mentor_id")
      .eq("id", espaco_id)
      .single();

    if (espacoError || !espaco) {
      return new Response(
        JSON.stringify({ error: "Espaço not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is mentor or admin
    const { data: userRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .single();

    const isMentor = espaco.mentor_id === userId;
    const isAdmin = userRole?.role === "admin";

    if (!isMentor && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Permission denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if invitation already exists
    const { data: existingInvitation } = await supabase
      .from("espaco_invitations")
      .select("id, status")
      .eq("espaco_id", espaco_id)
      .eq("email", email.toLowerCase())
      .single();

    if (existingInvitation) {
      if (existingInvitation.status === "pending") {
        return new Response(
          JSON.stringify({ error: "An invitation is already pending for this email" }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Update existing invitation to pending
      const { error: updateError } = await supabase
        .from("espaco_invitations")
        .update({
          status: "pending",
          invited_name,
          invited_by: userId,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        })
        .eq("id", existingInvitation.id);

      if (updateError) {
        console.error("Error updating invitation:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update invitation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      // Create new invitation
      const { error: insertError } = await supabase
        .from("espaco_invitations")
        .insert({
          espaco_id,
          email: email.toLowerCase(),
          invited_name,
          invited_by: userId,
        });

      if (insertError) {
        console.error("Error creating invitation:", insertError);
        return new Response(
          JSON.stringify({ error: "Failed to create invitation" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get the invitation token
    const { data: invitation } = await supabase
      .from("espaco_invitations")
      .select("token")
      .eq("espaco_id", espaco_id)
      .eq("email", email.toLowerCase())
      .single();

    // Get mentor name
    const { data: mentorProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    // Try to send email via Resend if configured
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    let emailSent = false;

    if (resendApiKey && invitation?.token) {
      const origin = req.headers.get("origin") || "https://enphub.lovable.app";
      const inviteLink = `${origin}/register?token=${invitation.token}&espaco_id=${espaco_id}`;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "EUA Na Prática <noreply@euanapratica.com>",
            to: [email],
            subject: `Você foi convidado para: ${espaco.name}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
                  <tr>
                    <td align="center">
                      <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                        <tr>
                          <td style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
                              Você foi convidado!
                            </h1>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 40px 30px;">
                            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                              Olá${invited_name ? ` ${invited_name}` : ''},
                            </p>
                            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                              ${mentorProfile?.full_name || 'Um mentor'} te convidou para participar do espaço:
                            </p>
                            <div style="background: linear-gradient(135deg, #f0f0ff, #faf5ff); border-radius: 16px; padding: 24px; margin: 24px 0; text-align: center;">
                              <h2 style="color: #6366f1; margin: 0; font-size: 20px; font-weight: 600;">
                                ${espaco.name}
                              </h2>
                            </div>
                            <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                              Clique no botão abaixo para criar sua conta e começar sua jornada:
                            </p>
                            <div style="text-align: center;">
                              <a href="${inviteLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                                Aceitar Convite
                              </a>
                            </div>
                            <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6; margin: 30px 0 0; text-align: center;">
                              Este convite expira em 7 dias.
                            </p>
                          </td>
                        </tr>
                        <tr>
                          <td style="background-color: #fafafa; padding: 20px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                              © ${new Date().getFullYear()} EUA Na Prática. Todos os direitos reservados.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </body>
              </html>
            `,
          }),
        });

        if (emailResponse.ok) {
          emailSent = true;
          console.log("Invitation email sent successfully");
        } else {
          const errorBody = await emailResponse.text();
          console.error("Failed to send email:", errorBody);
        }
      } catch (emailError) {
        console.error("Error sending email:", emailError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent ? "Invitation sent successfully" : "Invitation created (email not configured)",
        token: invitation?.token,
        emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-espaco-invitation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
