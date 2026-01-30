import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, full_name, phone } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller } } = await supabase.auth.getUser(token);
      
      if (caller) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", caller.id)
          .eq("role", "admin")
          .maybeSingle();
        
        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Acesso negado: apenas admins podem criar leads" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ user_id: existingProfile.id, existing: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with random password (they can reset it later)
    const randomPassword = crypto.randomUUID() + "Aa1!";
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    });

    if (authError) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Profile and role are created by trigger, but update phone if provided
    if (phone && authData.user) {
      await supabase
        .from("profiles")
        .update({ phone })
        .eq("id", authData.user.id);
    }

    return new Response(
      JSON.stringify({ user_id: authData.user!.id, existing: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
