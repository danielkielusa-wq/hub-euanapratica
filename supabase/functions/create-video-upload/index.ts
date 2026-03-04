/**
 * create-video-upload — Admin-only Edge Function
 *
 * Creates a video placeholder on Bunny.net Stream and returns
 * TUS resumable upload credentials for direct browser-to-Bunny upload.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { getApiConfig } from "../_shared/apiConfigService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  // Admin-only
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { lessonId, title } = await req.json();

    if (!lessonId || !title) {
      return new Response(
        JSON.stringify({ error: "lessonId and title are required" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Get Bunny credentials
    const bunnyConfig = await getApiConfig("bunny_stream");
    const apiKey = bunnyConfig.credentials.api_key;
    const libraryId = bunnyConfig.credentials.library_id;

    if (!apiKey || !libraryId) {
      return new Response(
        JSON.stringify({ error: "Bunny.net Stream not configured. Set api_key and library_id in credentials." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Step 1: Create video placeholder on Bunny
    const createRes = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos`,
      {
        method: "POST",
        headers: {
          "AccessKey": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to create video on Bunny.net", detail: errText }),
        { status: 502, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const videoData = await createRes.json();
    const videoId = videoData.guid;

    // Step 2: Generate TUS signature
    const expirationTime = Math.floor(Date.now() / 1000) + 86400; // 24 hours
    const signatureInput = `${libraryId}${apiKey}${expirationTime}${videoId}`;
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(signatureInput)
    );
    const signature = Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Step 3: Update lesson record with bunny_video_id
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch existing video ID so we can delete it from Bunny after replacement
    const { data: existingLesson } = await supabase
      .from("course_lessons")
      .select("bunny_video_id")
      .eq("id", lessonId)
      .single();

    const oldVideoId = existingLesson?.bunny_video_id;

    const { error: updateError } = await supabase
      .from("course_lessons")
      .update({
        bunny_video_id: videoId,
        video_status: "uploading",
        thumbnail_url: null,
        video_duration_seconds: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lessonId);

    if (updateError) {
    }

    // Delete old video from Bunny (fire-and-forget, don't block response)
    if (oldVideoId && oldVideoId !== videoId) {
      fetch(
        `https://video.bunnycdn.com/library/${libraryId}/videos/${oldVideoId}`,
        { method: "DELETE", headers: { "AccessKey": apiKey } }
      ).then((res) => {
      }).catch((err) => {
      });
    }

    return new Response(
      JSON.stringify({
        videoId,
        libraryId: Number(libraryId),
        expirationTime,
        signature,
        tusEndpoint: "https://video.bunnycdn.com/tusupload",
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
