/**
 * sync-content-calendar — Edge Function
 *
 * Called by PG trigger when production_date or scheduled_for changes on content_pieces.
 * 1. Dispatches N8N webhooks (calendar automation)
 * 2. Sends .ics calendar invite via Resend to configured emails (from app_configs)
 *
 * Events:
 *   - content.production_scheduled  → recording session calendar block
 *   - content.publish_scheduled     → publication calendar block
 *
 * Auth: requireAuthOrInternal (PG trigger via invoke_edge_function)
 */

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, requireAuthOrInternal } from "../_shared/authGuard.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";
import { generateICS, utf8ToBase64 } from "../_shared/calendarService.ts";
import { sendTemplatedEmail } from "../_shared/emailTemplateService.ts";

const FORMAT_LABELS: Record<string, string> = {
  short_video: "Short",
  long_video: "Video Longo",
  carousel: "Carrossel",
  static_post: "Post Estatico",
  story: "Story",
  live: "Live",
};

/** Read calendar recipients from app_configs (JSON array) */
async function getCalendarRecipients(sb: SupabaseClient): Promise<string[]> {
  try {
    const { data } = await sb
      .from("app_configs")
      .select("value")
      .eq("key", "content_calendar_recipients")
      .single();
    if (data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (err) {
    console.warn("Could not read calendar recipients from app_configs:", err);
  }
  return [];
}

/** Read timezone from app_configs (default America/New_York = EST) */
async function getCalendarTimezone(sb: SupabaseClient): Promise<string> {
  try {
    const { data } = await sb
      .from("app_configs")
      .select("value")
      .eq("key", "content_calendar_timezone")
      .single();
    if (data?.value) return data.value;
  } catch { /* use default */ }
  return "America/New_York";
}

/** Format a Date in the configured timezone, returning locale-aware parts */
function formatInTz(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: tz,
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) => parts.find(p => p.type === type)?.value || "";
  return {
    day: get("day"),
    month: get("month").replace(".", ""),  // "mar." → "mar"
    year: get("year"),
    weekday: get("weekday").charAt(0).toUpperCase() + get("weekday").slice(1),
    time: `${get("hour")}:${get("minute")}`,
  };
}

/** Build short TZ label from IANA name (America/New_York → EST/EDT) */
function tzLabel(date: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" });
  const tzPart = fmt.formatToParts(date).find(p => p.type === "timeZoneName");
  return tzPart?.value || tz;
}

/** Parse date parts for rich email template display */
function parseDateParts(rawDate: string, startDate: Date, endDate: Date, tz: string) {
  const s = formatInTz(startDate, tz);
  const e = formatInTz(endDate, tz);
  const label = tzLabel(startDate, tz);

  const isDateOnly = rawDate.length === 10;
  const timeRange = isDateOnly
    ? `${s.time} – ${e.time} ${label}`
    : `${s.time} ${label}`;

  return { day: s.day, monthShort: s.month, year: s.year, weekday: s.weekday, timeRange };
}

async function sendCalendarInvite(opts: {
  eventTitle: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  rawDate: string;
  link: string;
  action: string;
  recipients: string[];
  tz: string;
}) {
  if (opts.action === "deleted" || opts.recipients.length === 0) return;

  try {
    const icsContent = generateICS({
      title: opts.eventTitle,
      description: opts.eventType,
      startDate: opts.startDate,
      endDate: opts.endDate,
      url: opts.link,
    });
    const icsBase64 = utf8ToBase64(icsContent);

    const isNew = opts.action === "created";
    const subjectLine = isNew
      ? `📅 ${opts.eventTitle}`
      : `📅 Atualizado: ${opts.eventTitle}`;

    const dp = parseDateParts(opts.rawDate, opts.startDate, opts.endDate, opts.tz);

    // Send to each recipient individually (template system expects single `to`)
    for (const email of opts.recipients) {
      await sendTemplatedEmail({
        templateName: "content_calendar_invite",
        to: email,
        variables: {
          "{{subjectLine}}": subjectLine,
          "{{headerText}}": isNew ? "Novo evento no calendario" : "Evento atualizado",
          "{{statusBadge}}": isNew ? "NOVO" : "ATUALIZADO",
          "{{eventTitle}}": opts.eventTitle,
          "{{eventType}}": opts.eventType,
          "{{day}}": dp.day,
          "{{month}}": dp.monthShort,
          "{{year}}": dp.year,
          "{{weekday}}": dp.weekday,
          "{{timeRange}}": dp.timeRange,
          "{{pipelineLink}}": opts.link,
        },
        attachments: [
          {
            filename: "evento.ics",
            content: icsBase64,
            content_type: "text/calendar",
          },
        ],
      });
    }

    console.log(`Calendar invite sent to ${opts.recipients.join(", ")}`);
  } catch (err) {
    console.error("Failed to send calendar invite (non-blocking):", err);
  }
}

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const authError = await requireAuthOrInternal(req);
    if (authError) return authError;

    const {
      piece_id,
      title,
      format,
      production_date,
      scheduled_for,
      old_production_date,
      old_scheduled_for,
      status,
    } = await req.json();

    if (!piece_id) {
      return new Response(JSON.stringify({ error: "piece_id required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const baseUrl = Deno.env.get("SITE_URL") || "https://hub.euanapratica.com";
    const link = `${baseUrl}/admin/content-pipeline?piece=${piece_id}`;
    const pieceTitle = title || "Sem titulo";
    const formatLabel = FORMAT_LABELS[format] || format;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Read config once
    const recipients = await getCalendarRecipients(sb);
    const tz = await getCalendarTimezone(sb);

    let dispatched = 0;

    // Production date changed (set, updated, or cleared)
    if (production_date !== old_production_date) {
      const action = !production_date ? "deleted" : !old_production_date ? "created" : "updated";

      await dispatchN8NWebhook("content.production_scheduled", {
        piece_id,
        title: pieceTitle,
        format,
        status,
        production_date,
        old_production_date,
        action,
        link,
      }, sb);

      // Send calendar invite (12:00-15:00 EST on production day)
      if (production_date) {
        const start = new Date(`${production_date}T17:00:00Z`); // 12:00 EST
        const end = new Date(`${production_date}T20:00:00Z`);   // 15:00 EST
        await sendCalendarInvite({
          eventTitle: `Gravacao: ${pieceTitle} (${formatLabel})`,
          eventType: `Gravacao de conteudo — ${formatLabel}`,
          startDate: start,
          endDate: end,
          rawDate: production_date,
          link,
          action,
          recipients,
          tz,
        });
      }

      dispatched++;
    }

    // Publish date changed (set, updated, or cleared)
    if (scheduled_for !== old_scheduled_for) {
      const action = !scheduled_for ? "deleted" : !old_scheduled_for ? "created" : "updated";

      await dispatchN8NWebhook("content.publish_scheduled", {
        piece_id,
        title: pieceTitle,
        format,
        status,
        scheduled_for,
        old_scheduled_for,
        action,
        link,
      }, sb);

      // Send calendar invite (30min block at scheduled time)
      if (scheduled_for) {
        const start = new Date(scheduled_for);
        const end = new Date(start.getTime() + 30 * 60 * 1000); // +30min
        await sendCalendarInvite({
          eventTitle: `Publicar: ${pieceTitle} (${formatLabel})`,
          eventType: `Publicacao de conteudo — ${formatLabel}`,
          startDate: start,
          endDate: end,
          rawDate: scheduled_for,
          link,
          action,
          recipients,
          tz,
        });
      }

      dispatched++;
    }

    return new Response(
      JSON.stringify({ ok: true, dispatched, recipients_count: recipients.length }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("sync-content-calendar error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
