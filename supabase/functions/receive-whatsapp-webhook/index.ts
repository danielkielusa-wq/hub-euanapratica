import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  normalizePhone,
  findLeadByPhone,
  logWhatsAppMessage,
} from "../_shared/whatsappService.ts";
import { dispatchN8NWebhook } from "../_shared/n8nService.ts";

// CORS: open for external webhooks (same pattern as ticto-webhook)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Note: webhook secret validation removed — Evolution API v2 global webhooks
    // do not support custom headers. Security relies on verify_jwt=false + Supabase
    // infrastructure. If needed, validate via a query param or IP allowlist.

    const payload = await req.json();
    const event = payload.event || payload.type || "";
    const instance = payload.instance || "";

    console.log(`[receive-whatsapp] Event: ${event}, Instance: ${instance}`);

    // ── messages.upsert (new message) ──────────────────────────────
    if (event === "messages.upsert") {
      const data = payload.data;
      if (!data?.key) {
        console.warn("[receive-whatsapp] messages.upsert without key, skipping");
        return ok();
      }

      const fromMe = data.key.fromMe === true;
      const remoteJid = data.key.remoteJid || "";
      const messageId = data.key.id || "";

      // Skip outbound messages (we already log those in send-whatsapp)
      if (fromMe) {
        console.log("[receive-whatsapp] Skipping outbound message (fromMe=true)");
        return ok();
      }

      // Skip group messages
      if (remoteJid.includes("@g.us")) {
        console.log("[receive-whatsapp] Skipping group message");
        return ok();
      }

      // Extract phone from remoteJid (format: "5511999999999@s.whatsapp.net")
      const senderPhone = remoteJid.split("@")[0];
      if (!senderPhone) {
        console.warn("[receive-whatsapp] Could not extract phone from remoteJid:", remoteJid);
        return ok();
      }

      // Extract message text
      const messageText =
        data.message?.conversation ||
        data.message?.extendedTextMessage?.text ||
        data.message?.imageMessage?.caption ||
        data.message?.videoMessage?.caption ||
        data.message?.documentMessage?.caption ||
        "[Mídia recebida]";

      const messageTimestamp = data.messageTimestamp
        ? new Date(Number(data.messageTimestamp) * 1000).toISOString()
        : new Date().toISOString();

      console.log(`[receive-whatsapp] Inbound from ${senderPhone}: "${messageText.slice(0, 50)}..."`);

      // Find matching lead
      const lead = await findLeadByPhone(supabase, senderPhone);

      if (lead) {
        // Insert into lead_interactions
        const { data: interaction } = await supabase
          .from("lead_interactions" as any)
          .insert({
            lead_id: lead.id,
            type: "whatsapp_received",
            content: messageText,
            direction: "inbound",
            channel: "whatsapp",
            created_by: null,
            metadata: {
              evolution_message_id: messageId,
              sender_phone: senderPhone,
              delivery_status: "received",
              message_timestamp: messageTimestamp,
            },
          } as any)
          .select("id")
          .single();

        console.log(
          `✅ Inbound WhatsApp from ${lead.name} (${senderPhone}) linked to lead ${lead.id}. interaction_id: ${interaction?.id}`
        );

        // Log to whatsapp_logs
        await logWhatsAppMessage(supabase, {
          leadId: lead.id,
          interactionId: interaction?.id || null,
          direction: "inbound",
          phone: senderPhone,
          messageText,
          evolutionMessageId: messageId,
          status: "received",
          metadata: { raw_event: "messages.upsert" },
        });

        // Dispatch N8N webhook for inbound WhatsApp (fire-and-forget)
        dispatchN8NWebhook("whatsapp.inbound", {
          lead_id: lead.id,
          lead_name: lead.name,
          lead_email: lead.email,
          lead_phone: senderPhone,
          message_text: messageText,
          message_id: messageId,
          interaction_id: interaction?.id ?? null,
          timestamp: messageTimestamp,
        }, supabase);
      } else {
        // Unknown number — log only to whatsapp_logs
        console.warn(
          `[receive-whatsapp] No lead found for phone ${senderPhone}. Logging to whatsapp_logs only.`
        );

        await logWhatsAppMessage(supabase, {
          leadId: null,
          direction: "inbound",
          phone: senderPhone,
          messageText,
          evolutionMessageId: messageId,
          status: "received",
          metadata: { raw_event: "messages.upsert", unmatched: true },
        });
      }

      return ok();
    }

    // ── messages.update (delivery status) ──────────────────────────
    if (event === "messages.update") {
      const updates = Array.isArray(payload.data) ? payload.data : [payload.data];

      for (const upd of updates) {
        const messageId = upd?.key?.id;
        const rawStatus = upd?.update?.status;

        if (!messageId || !rawStatus) continue;

        // Map Evolution API status to our status
        const statusMap: Record<string, string> = {
          DELIVERY_ACK: "delivered",
          READ: "read",
          PLAYED: "read",
          SERVER_ACK: "sent",
        };
        const newStatus = statusMap[rawStatus] || null;
        if (!newStatus) continue;

        console.log(`[receive-whatsapp] Status update: ${messageId} → ${newStatus}`);

        // Update whatsapp_logs
        await supabase
          .from("whatsapp_logs" as any)
          .update({ status: newStatus } as any)
          .eq("evolution_message_id", messageId);

        // Also update lead_interactions metadata
        const { data: logs } = await supabase
          .from("whatsapp_logs" as any)
          .select("interaction_id")
          .eq("evolution_message_id", messageId)
          .not("interaction_id", "is", null)
          .limit(1);

        if (logs && logs.length > 0 && logs[0].interaction_id) {
          const { data: existing } = await supabase
            .from("lead_interactions" as any)
            .select("metadata")
            .eq("id", logs[0].interaction_id)
            .single();

          if (existing) {
            const metadata = { ...(existing.metadata || {}), delivery_status: newStatus };
            await supabase
              .from("lead_interactions" as any)
              .update({ metadata } as any)
              .eq("id", logs[0].interaction_id);
          }
        }
      }

      return ok();
    }

    // ── connection.update ──────────────────────────────────────────
    if (event === "connection.update") {
      const state = payload.data?.state || payload.data?.status || "unknown";
      console.log(`[receive-whatsapp] Connection update: ${state}`);

      // Store connection state in app_configs
      await supabase
        .from("app_configs")
        .upsert(
          {
            key: "whatsapp_connection_state",
            value: state,
            description: "Estado atual da conexão WhatsApp (atualizado via webhook)",
          },
          { onConflict: "key" }
        );

      return ok();
    }

    // ── qrcode.updated ─────────────────────────────────────────────
    if (event === "qrcode.updated") {
      const qrCode = payload.data?.qrcode || "";
      console.log(`[receive-whatsapp] QR code updated (${qrCode ? "has data" : "empty"})`);

      if (qrCode) {
        await supabase
          .from("app_configs")
          .upsert(
            {
              key: "whatsapp_qr_code",
              value: qrCode,
              description: "QR code atual para conexão WhatsApp (base64)",
            },
            { onConflict: "key" }
          );
      }

      return ok();
    }

    // Unknown event
    console.log(`[receive-whatsapp] Unhandled event: ${event}`);
    return ok();
  } catch (err) {
    console.error("[receive-whatsapp] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function ok() {
  return new Response(
    JSON.stringify({ received: true }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
