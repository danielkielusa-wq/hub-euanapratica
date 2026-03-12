/**
 * Send Espaco Invitation
 *
 * Creates an invitation for a student to join an espaco and sends
 * an email notification. Handles auth, permission checks, and
 * invitation record management.
 *
 * Uses centralized email template service for database-driven templates.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";
import { getCorsHeaders } from "../_shared/authGuard.ts";
import { createNotification } from "../_shared/notificationService.ts";

interface InvitationRequest {
  espaco_id: string;
  email: string;
  invited_name?: string;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[send-espaco-invitation] Function invoked");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          code: "AUTH_MISSING",
          message: "Sessão não encontrada. Por favor, faça login novamente."
        }),
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
        JSON.stringify({
          error: "Unauthorized",
          code: "AUTH_EXPIRED",
          message: "Sua sessão expirou. Por favor, faça login novamente."
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claims.user.id;

    // Use service role client for database operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { espaco_id, email, invited_name }: InvitationRequest = await req.json();
    console.log("[send-espaco-invitation] Request:", { espaco_id, email, invited_name, userId });

    if (!espaco_id || !email) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          code: "MISSING_FIELDS",
          message: "ID do espaço e email são obrigatórios."
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          code: "INVALID_EMAIL",
          message: "Formato de email inválido."
        }),
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
        JSON.stringify({
          error: "Not Found",
          code: "ESPACO_NOT_FOUND",
          message: "Espaço não encontrado."
        }),
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
        JSON.stringify({
          error: "Forbidden",
          code: "PERMISSION_DENIED",
          message: "Você não tem permissão para convidar alunos neste espaço."
        }),
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
      // Refresh existing invitation (pending or expired/cancelled) — resend email
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

    const origin = req.headers.get("origin") || "https://enphub.lovable.app";
    const inviteLink = invitation?.token
      ? `${origin}/cadastro?token=${invitation.token}&espaco_id=${espaco_id}`
      : null;


    // Send email via template service
    let emailSent = false;

    if (invitation?.token && inviteLink) {
      const invitedNameGreeting = invited_name ? ` <strong>${invited_name}</strong>` : "";

      const result = await sendTemplatedEmail({
        templateName: "espaco_invitation",
        to: email,
        variables: {
          "{{invitedNameGreeting}}": invitedNameGreeting,
          "{{mentorName}}": mentorProfile?.full_name || "Um mentor",
          "{{espacoName}}": espaco.name,
          "{{inviteLink}}": inviteLink,
        },
      });

      emailSent = result.emailSent;
      console.log("[send-espaco-invitation] Email result:", JSON.stringify(result));
    } else {
      console.log("[send-espaco-invitation] No token/link, skipping email", { token: invitation?.token, inviteLink });
    }

    // Notify the invited user (if they already have an account)
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .single();

    console.log("[send-espaco-invitation] Existing user lookup:", { email: email.toLowerCase(), found: !!existingUser, userId: existingUser?.id });

    if (existingUser) {
      await createNotification({
        userId: existingUser.id,
        type: "espaco_invitation",
        title: `Convite: ${espaco.name}`,
        message: `${mentorProfile?.full_name || "Um mentor"} convidou você para o espaço "${espaco.name}"`,
        actionUrl: inviteLink || `/dashboard/espacos`,
        category: "scheduling",
      });
      console.log("[send-espaco-invitation] Notification created for invited user:", existingUser.id);
    }

    // Notify the mentor who sent the invite
    await createNotification({
      userId,
      type: "espaco_invitation_sent",
      title: `Convite enviado`,
      message: `Convite para ${invited_name || email} no espaço "${espaco.name}" foi ${emailSent ? "enviado por email" : "criado"}`,
      actionUrl: `/mentor/espacos/${espaco_id}`,
      category: "scheduling",
    });
    console.log("[send-espaco-invitation] Notification created for mentor:", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: emailSent ? "Invitation sent successfully" : "Invitation created (email not sent)",
        token: invitation?.token,
        emailSent,
        inviteLink: emailSent ? undefined : inviteLink, // Only provide link as fallback if email failed
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-espaco-invitation] UNCAUGHT ERROR:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
