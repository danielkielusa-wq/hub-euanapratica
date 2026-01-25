import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ProcessInvitationRequest {
  token: string;
  user_id: string;
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

    const { token: invitationToken }: ProcessInvitationRequest = await req.json();

    if (!invitationToken) {
      return new Response(
        JSON.stringify({ error: "Invitation token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find the invitation
    const { data: invitation, error: invitationError } = await supabase
      .from("espaco_invitations")
      .select("*")
      .eq("token", invitationToken)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString())
      .single();

    if (invitationError || !invitation) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired invitation" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is already enrolled
    const { data: existingEnrollment } = await supabase
      .from("user_espacos")
      .select("id")
      .eq("user_id", userId)
      .eq("espaco_id", invitation.espaco_id)
      .single();

    if (existingEnrollment) {
      // Mark invitation as accepted but don't create duplicate enrollment
      await supabase
        .from("espaco_invitations")
        .update({
          status: "accepted",
          accepted_by: userId,
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: "User already enrolled in this space",
          espaco_id: invitation.espaco_id,
          already_enrolled: true,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create enrollment
    const { error: enrollmentError } = await supabase
      .from("user_espacos")
      .insert({
        user_id: userId,
        espaco_id: invitation.espaco_id,
        enrolled_by: invitation.invited_by,
        status: "active",
      });

    if (enrollmentError) {
      console.error("Error creating enrollment:", enrollmentError);
      return new Response(
        JSON.stringify({ error: "Failed to enroll user" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update invitation status
    const { error: updateError } = await supabase
      .from("espaco_invitations")
      .update({
        status: "accepted",
        accepted_by: userId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", invitation.id);

    if (updateError) {
      console.error("Error updating invitation:", updateError);
    }

    // Get espaco name for response
    const { data: espaco } = await supabase
      .from("espacos")
      .select("name")
      .eq("id", invitation.espaco_id)
      .single();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully enrolled in space",
        espaco_id: invitation.espaco_id,
        espaco_name: espaco?.name,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-invitation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
