import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, validateUserAuth } from "../_shared/authGuard.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  // Auth
  const auth = await validateUserAuth(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
  const userId = auth.userId;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const url = new URL(req.url);
  const ideaId = url.searchParams.get("id");

  try {
    // GET — list all ideas for user
    if (req.method === "GET") {
      const { data, error } = await supabase
        .from("business_ideas")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // POST — create new idea
    if (req.method === "POST") {
      const body = await req.json();
      const { data, error } = await supabase
        .from("business_ideas")
        .insert({
          user_id: userId,
          name: body.name || "Untitled Idea",
          column_status: body.column_status || "spark",
          one_liner: body.one_liner || "",
          problem: body.problem || "",
          persona: body.persona || "",
          interest_score: body.interest_score || 0,
          tags: body.tags || [],
          notes: body.notes || "",
          existing_assets: body.existing_assets || "",
          market_size: body.market_size || null,
          competition: body.competition || null,
          unfair_advantage: body.unfair_advantage || "",
          distribution_hypothesis: body.distribution_hypothesis || "",
          revenue_model: body.revenue_model || "",
          validation_method: body.validation_method || null,
          signals_collected: body.signals_collected || "",
          strongest_objection: body.strongest_objection || "",
          kill_criteria: body.kill_criteria || "",
          pricing_model: body.pricing_model || "",
          mvp_scope: body.mvp_scope || "",
          key_metric: body.key_metric || "",
          integrations: body.integrations || "",
          gate_answers: body.gate_answers || {},
        })
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        status: 201,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // PUT — update idea
    if (req.method === "PUT") {
      if (!ideaId) {
        return new Response(JSON.stringify({ error: "Missing id parameter" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const body = await req.json();
      // Remove fields that shouldn't be updated directly
      delete body.id;
      delete body.user_id;
      delete body.created_at;
      delete body.updated_at;

      const { data, error } = await supabase
        .from("business_ideas")
        .update(body)
        .eq("id", ideaId)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify(data), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // DELETE — delete idea
    if (req.method === "DELETE") {
      if (!ideaId) {
        return new Response(JSON.stringify({ error: "Missing id parameter" }), {
          status: 400,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("business_ideas")
        .delete()
        .eq("id", ideaId)
        .eq("user_id", userId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("manage-ideas error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
