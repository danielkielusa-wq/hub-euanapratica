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
        return new Response(
          JSON.stringify({ error: "Library ID mismatch" }),
          { status: 403, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    } catch (configErr) {
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

        // Fetch video metadata
        const videoRes = await fetch(
          `https://video.bunnycdn.com/library/${libraryId}/videos/${VideoGuid}`,
          { headers: { "AccessKey": apiKey } }
        );

        if (videoRes.ok) {
          const videoData = await videoRes.json();
          duration = videoData.length ? Math.round(videoData.length) : null;

          // Get CDN hostname — try credential first, then fetch from library API
          let cdnHostname = bunnyConfig.credentials.cdn_hostname;
          if (!cdnHostname) {
            try {
              const libRes = await fetch(
                `https://video.bunnycdn.com/library/${libraryId}`,
                { headers: { "AccessKey": apiKey } }
              );
              if (libRes.ok) {
                const libData = await libRes.json();
                cdnHostname = libData.CdnHostname || libData.cdnHostname;
              }
            } catch (libErr) {
            }
          }

          if (cdnHostname) {
            const thumbFile = videoData.thumbnailFileName || "thumbnail.jpg";
            thumbnailUrl = `https://${cdnHostname}/${VideoGuid}/${thumbFile}`;
          }

        }
      } catch (metaErr) {
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
      } else {
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
      } else {
      }
    } else if (Status === 9) {
      // CaptionsGenerated — mark lesson as having captions
      const { error } = await supabase
        .from("course_lessons")
        .update({ captions_generated: true, updated_at: new Date().toISOString() })
        .eq("bunny_video_id", VideoGuid);

      if (error) {
      } else {
      }
    } else if (Status === 10) {
      // TitleOrDescriptionGenerated — auto-fill empty lesson description
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
          const aiDescription = videoData.metaDescription || videoData.MetaDescription;

          if (aiDescription) {
            // Only fill if lesson currently has no description
            const { data: lesson } = await supabase
              .from("course_lessons")
              .select("id, description")
              .eq("bunny_video_id", VideoGuid)
              .maybeSingle();

            if (lesson && !lesson.description) {
              await supabase
                .from("course_lessons")
                .update({ description: aiDescription, updated_at: new Date().toISOString() })
                .eq("id", lesson.id);
            }
          }
        }
      } catch (metaErr) {
      }
    } else {
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
