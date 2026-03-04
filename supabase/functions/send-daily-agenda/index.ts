/**
 * Send Daily Agenda
 *
 * Fires every weekday at 6am BRT (scheduled via pg_cron at 9am UTC or via N8N).
 * Sends today's planned tasks to Telegram and Email.
 *
 * Auth: internal secret only (x-internal-secret header)
 *
 * Required Supabase secrets:
 *   TELEGRAM_BOT_TOKEN  — from @BotFather
 *   TELEGRAM_CHAT_ID    — your personal chat ID (get via @userinfobot)
 *   ADMIN_NOTIFICATION_EMAIL — your email address
 */

import { getApiConfig } from "../_shared/apiConfigService.ts";
import { validateInternalCall, getCorsHeaders } from "../_shared/authGuard.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "fundador" | "crm" | "creator";
type TimeOfDay = "morning" | "evening";

interface AgendaTask {
  id: string;
  day: number; // 0=Mon … 4=Fri
  timeOfDay: TimeOfDay;
  role: Role;
  title: string;
  action?: { label: string; href: string };
}

// ─── Static Task List (mirrors frontend) ─────────────────────────────────────

const BASE_URL = "https://hub.euanapratica.com";

const TASKS: AgendaTask[] = [
  // Segunda (0)
  { id: "mon-m-1", day: 0, timeOfDay: "morning", role: "fundador", title: "Revisão da semana anterior", action: { label: "Leads Dashboard", href: "/admin/leads-dashboard" } },
  { id: "mon-m-2", day: 0, timeOfDay: "morning", role: "crm", title: "Leads novos + WhatsApp pendentes", action: { label: "Ver leads", href: "/admin/leads-dashboard" } },
  { id: "mon-m-3", day: 0, timeOfDay: "morning", role: "creator", title: "Planejar pauta da semana" },
  { id: "mon-e-1", day: 0, timeOfDay: "evening", role: "fundador", title: "Definir 3 prioridades da semana" },
  { id: "mon-e-2", day: 0, timeOfDay: "evening", role: "crm", title: "Configurar disparos programados", action: { label: "Fluxos WA", href: "/admin/whatsapp-flows" } },
  { id: "mon-e-3", day: 0, timeOfDay: "evening", role: "creator", title: "Agendar posts e conteúdos" },
  // Terça (1)
  { id: "tue-m-1", day: 1, timeOfDay: "morning", role: "crm", title: "Follow-up leads quentes", action: { label: "Dashboard", href: "/admin/leads-dashboard" } },
  { id: "tue-m-2", day: 1, timeOfDay: "morning", role: "fundador", title: "Saúde do sistema + custos de API", action: { label: "Saúde", href: "/admin/saude-sistema" } },
  { id: "tue-m-3", day: 1, timeOfDay: "morning", role: "creator", title: "Analisar engajamento recente" },
  { id: "tue-e-1", day: 1, timeOfDay: "evening", role: "crm", title: "Atualizar pipeline de leads" },
  { id: "tue-e-2", day: 1, timeOfDay: "evening", role: "creator", title: "Criar rascunho de conteúdo" },
  // Quarta (2)
  { id: "wed-m-1", day: 2, timeOfDay: "morning", role: "fundador", title: "Assinaturas: novos e cancelamentos", action: { label: "Assinaturas", href: "/admin/assinaturas" } },
  { id: "wed-m-2", day: 2, timeOfDay: "morning", role: "crm", title: "Agendamentos e sessões do dia", action: { label: "Agendamentos", href: "/admin/agendamentos" } },
  { id: "wed-m-3", day: 2, timeOfDay: "morning", role: "creator", title: "Publicar conteúdo de meio de semana" },
  { id: "wed-e-1", day: 2, timeOfDay: "evening", role: "fundador", title: "Análise de custos da semana", action: { label: "Custos API", href: "/admin/custos-api" } },
  { id: "wed-e-2", day: 2, timeOfDay: "evening", role: "crm", title: "Contato ativo: leads em decisão" },
  // Quinta (3)
  { id: "thu-m-1", day: 3, timeOfDay: "morning", role: "crm", title: "Lote WA: leads inativos", action: { label: "Envio em Lote", href: "/admin/whatsapp-flows" } },
  { id: "thu-m-2", day: 3, timeOfDay: "morning", role: "creator", title: "Produzir ou gravar conteúdo" },
  { id: "thu-m-3", day: 3, timeOfDay: "morning", role: "fundador", title: "Revisar automações N8N", action: { label: "Automações", href: "/admin/automacoes" } },
  { id: "thu-e-1", day: 3, timeOfDay: "evening", role: "crm", title: "Follow-up de agendamentos" },
  { id: "thu-e-2", day: 3, timeOfDay: "evening", role: "creator", title: "Editar e preparar conteúdo" },
  // Sexta (4)
  { id: "fri-m-1", day: 4, timeOfDay: "morning", role: "fundador", title: "Retrospectiva da semana" },
  { id: "fri-m-2", day: 4, timeOfDay: "morning", role: "crm", title: "Fechar ciclo de leads" },
  { id: "fri-m-3", day: 4, timeOfDay: "morning", role: "creator", title: "Publicar conteúdo de fechamento" },
  { id: "fri-e-1", day: 4, timeOfDay: "evening", role: "fundador", title: "Inteligência Semanal", action: { label: "Ver relatório", href: "/admin/inteligencia-semanal" } },
  { id: "fri-e-2", day: 4, timeOfDay: "evening", role: "crm", title: "Relatório de atividades CRM", action: { label: "Atividades", href: "/admin/atividades" } },
  { id: "fri-e-3", day: 4, timeOfDay: "evening", role: "creator", title: "Análise de métricas de conteúdo" },
];

const DAY_NAMES = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
const MONTHS_PT = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const ROLE_LABELS: Record<Role, string> = { fundador: "Fundador", crm: "CRM", creator: "Creator" };
const ROLE_EMOJI: Record<Role, string> = { fundador: "🟡", crm: "🟢", creator: "🟠" };

// ─── Formatters ───────────────────────────────────────────────────────────────

function formatTelegram(dayIndex: number, date: Date, tasks: AgendaTask[]): string {
  const morning = tasks.filter((t) => t.timeOfDay === "morning");
  const evening = tasks.filter((t) => t.timeOfDay === "evening");
  const dateStr = `${date.getDate()} de ${MONTHS_PT[date.getMonth()]}`;

  let msg = `<b>📅 Agenda de ${DAY_NAMES[dayIndex]} — ${dateStr}</b>\n\n`;

  msg += `<b>🌅 MANHÃ</b>\n`;
  morning.forEach((t, i) => {
    const prefix = i === morning.length - 1 ? "└" : "├";
    msg += `${prefix} ${ROLE_EMOJI[t.role]} <b>[${ROLE_LABELS[t.role]}]</b> ${t.title}\n`;
    if (t.action) msg += `   <a href="${BASE_URL}${t.action.href}">→ ${t.action.label}</a>\n`;
  });

  msg += `\n<b>🌙 FINAL DO DIA</b>\n`;
  evening.forEach((t, i) => {
    const prefix = i === evening.length - 1 ? "└" : "├";
    msg += `${prefix} ${ROLE_EMOJI[t.role]} <b>[${ROLE_LABELS[t.role]}]</b> ${t.title}\n`;
    if (t.action) msg += `   <a href="${BASE_URL}${t.action.href}">→ ${t.action.label}</a>\n`;
  });

  msg += `\n<a href="${BASE_URL}/admin/agenda-semanal">🔗 Ver agenda completa no Hub</a>`;
  return msg;
}

function formatEmailHtml(dayIndex: number, date: Date, tasks: AgendaTask[]): string {
  const morning = tasks.filter((t) => t.timeOfDay === "morning");
  const evening = tasks.filter((t) => t.timeOfDay === "evening");
  const dateStr = `${date.getDate()} de ${MONTHS_PT[date.getMonth()]} de ${date.getFullYear()}`;

  const ROLE_COLORS: Record<Role, { color: string; bg: string }> = {
    fundador: { color: "#d4a84b", bg: "#fdf6e3" },
    crm: { color: "#0d9488", bg: "#e0f7f4" },
    creator: { color: "#ea580c", bg: "#fff0e6" },
  };

  const renderTask = (t: AgendaTask) => {
    const rc = ROLE_COLORS[t.role];
    return `
      <div style="border:1px solid #e8e1d5;border-radius:10px;padding:12px 14px;margin-bottom:8px;background:#fdfcfa;">
        <span style="font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${rc.color};background:${rc.bg};padding:2px 8px;border-radius:100px;">${ROLE_LABELS[t.role]}</span>
        <div style="font-size:14px;font-weight:600;color:#1a1a14;margin-top:6px;line-height:1.3;">${t.title}</div>
        ${t.action ? `<a href="${BASE_URL}${t.action.href}" style="font-size:11px;color:${rc.color};text-decoration:none;display:inline-block;margin-top:5px;font-weight:500;">→ ${t.action.label}</a>` : ""}
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f2ede8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
  <!-- Header -->
  <div style="background:#0f0d0a;padding:28px 32px 24px;">
    <div style="font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:#5a5045;margin-bottom:6px;">ENP Hub · Planejamento</div>
    <div style="font-size:24px;font-weight:700;color:#f0e6d3;line-height:1.2;">📅 ${DAY_NAMES[dayIndex]}</div>
    <div style="font-size:13px;color:#7a6e61;margin-top:4px;">${dateStr}</div>
  </div>
  <!-- Body -->
  <div style="padding:24px 32px 28px;">
    <!-- Morning -->
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9a8a70;margin-bottom:12px;">🌅 Manhã</div>
    ${morning.map(renderTask).join("")}
    <!-- Divider -->
    <div style="height:1px;background:#e8e1d5;margin:20px 0;"></div>
    <!-- Evening -->
    <div style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#9a8a70;margin-bottom:12px;">🌙 Final do dia</div>
    ${evening.map(renderTask).join("")}
    <!-- CTA -->
    <div style="text-align:center;margin-top:28px;">
      <a href="${BASE_URL}/admin/agenda-semanal" style="display:inline-block;background:#d4a84b;color:#0f0d0a;padding:13px 32px;border-radius:10px;font-weight:700;font-size:13px;text-decoration:none;letter-spacing:0.03em;">
        Ver Agenda Completa →
      </a>
    </div>
  </div>
  <!-- Footer -->
  <div style="background:#fafaf8;border-top:1px solid #e8e1d5;padding:14px 32px;text-align:center;">
    <div style="font-size:11px;color:#aaa09a;">ENP Hub · Notificação automática diária · 6h BRT</div>
  </div>
</div>
</body></html>`;
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  // Internal-only: must have x-internal-secret
  if (!validateInternalCall(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  try {
    // ── Determine today in BRT (UTC-3, Brazil does not observe DST since 2019) ──
    const nowUTC = new Date();
    const nowBRT = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000);
    const dayOfWeek = nowBRT.getDay(); // 0=Sun … 6=Sat
    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0=Mon … 4=Fri

    if (dayIndex > 4) {
      return new Response(
        JSON.stringify({ message: "Fim de semana — nenhuma agenda enviada", day: dayOfWeek }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const todayTasks = TASKS.filter((t) => t.day === dayIndex);
    const results: Record<string, string> = {};

    // ── Telegram ──────────────────────────────────────────────────────────────
    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

    if (botToken && chatId) {
      try {
        const telegramBody = formatTelegram(dayIndex, nowBRT, todayTasks);
        const tgRes = await fetch(
          `https://api.telegram.org/bot${botToken}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: telegramBody,
              parse_mode: "HTML",
              disable_web_page_preview: false,
            }),
          }
        );
        const tgData = await tgRes.json();
        results.telegram = tgData.ok
          ? "sent"
          : `error: ${tgData.description ?? tgRes.statusText}`;
      } catch (err) {
        results.telegram = `error: ${err}`;
      }
    } else {
      results.telegram = "skipped — TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set";
    }

    // ── Email via Resend ──────────────────────────────────────────────────────
    try {
      const resendConfig = await getApiConfig("resend_email");
      const resendKey = resendConfig?.credentials?.api_key;
      const adminEmail = Deno.env.get("ADMIN_NOTIFICATION_EMAIL");

      if (!resendKey) {
        results.email = "skipped — resend_email API config not found";
      } else if (!adminEmail) {
        results.email = "skipped — ADMIN_NOTIFICATION_EMAIL secret not set";
      } else {
        const htmlBody = formatEmailHtml(dayIndex, nowBRT, todayTasks);
        const dateStr = `${nowBRT.getDate()} de ${MONTHS_PT[nowBRT.getMonth()]}`;
        const emailRes = await fetch(`${resendConfig.base_url ?? "https://api.resend.com"}/emails`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "ENP Hub <noreply@euanapratica.com>",
            to: [adminEmail],
            subject: `📅 Agenda de ${DAY_NAMES[dayIndex]} — ${dateStr}`,
            html: htmlBody,
          }),
        });
        results.email = emailRes.ok ? "sent" : `error: ${emailRes.statusText}`;
      }
    } catch (err) {
      results.email = `error: ${err}`;
    }

    return new Response(
      JSON.stringify({
        success: true,
        day: DAY_NAMES[dayIndex],
        taskCount: todayTasks.length,
        ...results,
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
