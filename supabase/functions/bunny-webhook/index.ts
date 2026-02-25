/**
 * bunny-webhook — Public Edge Function (no JWT)
 *
 * Receives Bunny.net Stream webhook notifications when video
 * processing completes or fails. Updates course_lessons accordingly.
 *
 * Bunny posts: { VideoLibraryId, VideoGuid, Status }
 * Status: 0=Queued, 1=Processing, 2=Encoding, 3=Finished, 4=ResolutionFinished, 5=Failed
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/authGuard.ts";
import { getApiConfig } from "../_shared/apiConfigService.ts";

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  try {
    const payload = await req.json();
    const { VideoLibraryId, VideoGuid, Status } = payload;

    console.log("[bunny-webhook] Received:", { VideoLibraryId, VideoGuid, Status });

    if (!VideoGuid || Status === undefined) {
      return new Response(
        JSON.stringify({ error: "Invalid payload" }),
        { status: 400, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Validate library ID matches our config
    try {
      const bunnyConfig = await getApiConfig("bunny_stream");
      const configLibraryId = bunnyConfig.credentials.library_id;
      if (configLibraryId && String(VideoLibraryId) !== String(configLibraryId)) {
        console.warn("[bunny-webhook] Library ID mismatch:", { received: VideoLibraryId, expected: configLibraryId });
        return new Response(
          JSON.stringify({ error: "Library ID mismatch" }),
          { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    } catch (configErr) {
      console.warn("[bunny-webhook] Could not validate library ID:", configErr);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Status 3 = Finished (all resolutions done), 4 = First resolution ready
    if (Status === 3 || Status === 4) {
      // Fetch video metadata from Bunny
      let duration: number | null = null;
      let thumbnailUrl: string | null = null;

      try {
        const bunnyConfig = await getApiConfig("bunny_stream");
        const apiKey = bunnyConfig.credentials.api_key;
        const libraryId = bunnyConfig.credentials.library_id;

        const videoRes = await fetch(
          `https://video.bunnycdn.com/library/${libraryId}/videos/${VideoGuid}`,
          { headers: { "AccessKey": apiKey } }
        );

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          duration = videoData.length ? Math.round(videoData.length) : null;
          // Bunny thumbnail URL format
          thumbnailUrl = `https://vz-${libraryId}.b-cdn.net/${VideoGuid}/thumbnail.jpg`;
          console.log("[bunny-webhook] Video metadata:", { duration, thumbnailUrl, status: videoData.status });
        }
      } catch (metaErr) {
        console.error("[bunny-webhook] Failed to fetch video metadata:", metaErr);
      }

      const updateData: Record<string, unknown> = {
        video_status: "ready",
        updated_at: new Date().toISOString(),
      };
      if (duration !== null) updateData.video_duration_seconds = duration;
      if (thumbnailUrl) updateData.thumbnail_url = thumbnailUrl;

      const { error } = await supabase
        .from("course_lessons")
        .update(updateData)
        .eq("bunny_video_id", VideoGuid);

      if (error) {
        console.error("[bunny-webhook] Failed to update lesson:", error);
      } else {
        console.log("[bunny-webhook] Lesson updated to ready:", VideoGuid);
      }
    } else if (Status === 5) {
      // Failed
      const { error } = await supabase
        .from("course_lessons")
        .update({
          video_status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("bunny_video_id", VideoGuid);

      if (error) {
        console.error("[bunny-webhook] Failed to update lesson:", error);
      } else {
        console.log("[bunny-webhook] Lesson marked as failed:", VideoGuid);
      }
    } else {
      console.log("[bunny-webhook] Ignoring status:", Status);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[bunny-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
