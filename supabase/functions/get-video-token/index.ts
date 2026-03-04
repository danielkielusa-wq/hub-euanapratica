/**
 * get-video-token — Authenticated Edge Function
 *
 * Checks that the user has access to a course lesson and returns
 * a signed Bunny.net embed URL with short expiry.
 *
 * Access granted if: admin, is_free_preview=true, or active enrollment.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateUserAuth, getCorsHeaders } from "../_shared/authGuard.ts";
import { getApiConfig } from "../_shared/apiConfigService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Authenticate user
    const auth = await validateUserAuth(req);
    if (!auth.authenticated || !auth.userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const { lessonId } = await req.json();
    if (!lessonId) {
      return new Response(
        JSON.stringify({ error: "lessonId is required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch lesson with module → espaco chain
    const { data: lesson, error: lessonError } = await supabase
      .from("course_lessons")
      .select(`
        id, bunny_video_id, video_url, is_free_preview,
        course_modules!inner(espaco_id)
      `)
      .eq("id", lessonId)
      .single();

    if (lessonError || !lesson) {
      return new Response(
        JSON.stringify({ error: "Lesson not found" }),
        { status: 404, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const espacoId = (lesson.course_modules as any).espaco_id;

    // Check access: admin always allowed
    if (auth.role !== "admin") {
      // Free preview lessons are always accessible
      if (!lesson.is_free_preview) {
        // Check active enrollment
        const { data: enrollment } = await supabase
          .from("user_espacos")
          .select("id")
          .eq("user_id", auth.userId)
          .eq("espaco_id", espacoId)
          .eq("status", "active")
          .maybeSingle();

        if (!enrollment) {
          return new Response(
            JSON.stringify({ error: "Access denied. Course enrollment required." }),
            { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // If no Bunny video, return the fallback video_url
    if (!lesson.bunny_video_id) {
      return new Response(
        JSON.stringify({
          embedUrl: lesson.video_url || null,
          provider: "external",
        }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Generate signed Bunny embed URL
    const bunnyConfig = await getApiConfig("bunny_stream");
    const tokenAuthKey = bunnyConfig.credentials.token_auth_key;
    const libraryId = bunnyConfig.credentials.library_id;

    if (!tokenAuthKey || !libraryId) {
      return new Response(
        JSON.stringify({ error: "Bunny.net Stream token not configured" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const expiresAt = Math.floor(Date.now() / 1000) + 172800; // 48 hours
    const hashInput = `${tokenAuthKey}${lesson.bunny_video_id}${expiresAt}`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(hashInput)
    );
    const token = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${lesson.bunny_video_id}?token=${token}&expires=${expiresAt}&autoplay=false&preload=true&responsive=true&showPlaybackSpeed=true&showChapters=true`;

    return new Response(
      JSON.stringify({ embedUrl, provider: "bunny" }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
