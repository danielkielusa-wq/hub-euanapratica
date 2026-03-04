import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const headers = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // P0-2: Admin-only — was previously optional auth
    const authError = await requireAdmin(req);
    if (authError) return authError;

    const { email, full_name, phone } = await req.json();

    if (!email || !full_name) {
      return new Response(
        JSON.stringify({ error: "Email e nome são obrigatórios" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Formato de email inválido" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", email.toLowerCase())
      .maybeSingle();

    if (existingProfile) {
      return new Response(
        JSON.stringify({ user_id: existingProfile.id, existing: true }),
        { headers: { ...headers, "Content-Type": "application/json" } }
      );
    }

    // Create auth user with random password (they can reset it later)
    const randomPassword = crypto.randomUUID() + "Aa1!";

    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: randomPassword,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    });

    if (createError) {
      if (createError.code === "email_exists") {
        const { data: existingProfileAfterError } = await supabase
          .from("profiles")
          .select("id")
          .ilike("email", email.toLowerCase())
          .maybeSingle();

        if (existingProfileAfterError?.id) {
          return new Response(
            JSON.stringify({ user_id: existingProfileAfterError.id, existing: true }),
            { headers: { ...headers, "Content-Type": "application/json" } }
          );
        }

        let existingUserId: string | null = null;
        let page = 1;
        const perPage = 1000;

        while (!existingUserId && page <= 10) {
          const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page, perPage });

          if (usersError) {
            return new Response(
              JSON.stringify({ error: "Erro ao buscar usuário existente" }),
              { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
            );
          }

          const match = usersData?.users?.find((user) => (user.email || "").toLowerCase() === email.toLowerCase());
          if (match) {
            existingUserId = match.id;
            break;
          }

          if (!usersData?.users?.length || usersData.users.length < perPage) {
            break;
          }

          page += 1;
        }

        if (!existingUserId) {
          return new Response(
            JSON.stringify({ error: "Erro ao criar lead" }),
            { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
          );
        }

        await supabase
          .from("profiles")
          .upsert(
            {
              id: existingUserId,
              email: email.toLowerCase(),
              full_name,
              phone: phone || null
            },
            { onConflict: "id" }
          );

        return new Response(
          JSON.stringify({ user_id: existingUserId, existing: true }),
          { headers: { ...headers, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao criar lead" }),
        { status: 400, headers: { ...headers, "Content-Type": "application/json" } }
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
      { headers: { ...headers, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
