import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { getApiConfig } from "../_shared/apiConfigService.ts";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import { isUnsubscribed, generateUnsubscribeToken, generateUnsubscribeLink } from "../_shared/emailCampaignService.ts";

interface DigestRequest {
  test_email?: string; // Optional: send to specific email for testing
  user_ids?: string[]; // Optional: send to specific users only
}

interface JobForDigest {
  id: string;
  title: string;
  company: string;
  logo_url: string | null;
  location: string;
  remote_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  industry: string | null;
  ai_enrichment: {
    timezone_analysis?: { compatibility_score?: number };
    english_level_required?: string;
    salary_brl_context?: { monthly_brl?: number };
    application_tips?: string[];
  } | null;
  created_at: string;
}

const REMOTE_TYPE_LABELS: Record<string, string> = {
  fully_remote: "100% Remoto",
  hybrid: "Hibrido",
  onsite: "Presencial",
};

function formatSalary(min: number | null, max: number | null, currency: string): string {
  if (!min && !max) return "A combinar";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }
  if (min) return `A partir de ${formatter.format(min)}`;
  if (max) return `Ate ${formatter.format(max)}`;
  return "A combinar";
}

const DEFAULT_TIP = "Personalize seu curriculo para cada vaga usando nosso ResumePass AI. Candidatos com curriculos personalizados tem 3x mais chances de receber retorno!";

function getWeeklyTip(jobs: JobForDigest[]): string {
  const allTips: string[] = [];
  for (const job of jobs) {
    if (job.ai_enrichment?.application_tips) {
      allTips.push(...job.ai_enrichment.application_tips);
    }
  }
  if (allTips.length === 0) return DEFAULT_TIP;
  return allTips[Math.floor(Math.random() * allTips.length)];
}

function buildJobCardsHtml(jobs: JobForDigest[], origin: string): string {
  return jobs.map((job) => {
    const ai = job.ai_enrichment;
    const enrichmentBadges = ai ? [
      ai.timezone_analysis?.compatibility_score != null
        ? `<span style="display:inline-block;padding:2px 8px;background:#eff6ff;color:#1d4ed8;border-radius:6px;font-size:11px;font-weight:600;margin-right:4px;">Fuso ${ai.timezone_analysis.compatibility_score}/10</span>`
        : "",
      ai.english_level_required
        ? `<span style="display:inline-block;padding:2px 8px;background:#f0fdf4;color:#166534;border-radius:6px;font-size:11px;font-weight:600;margin-right:4px;">${ai.english_level_required}</span>`
        : "",
      ai.salary_brl_context?.monthly_brl
        ? `<span style="display:inline-block;padding:2px 8px;background:#fef3c7;color:#92400e;border-radius:6px;font-size:11px;font-weight:600;">R$${ai.salary_brl_context.monthly_brl.toLocaleString("pt-BR")}/mes</span>`
        : "",
    ].filter(Boolean).join("") : "";

    return `
    <tr>
      <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width: 48px; vertical-align: top;">
              <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; text-align: center; line-height: 48px;">
                ${job.company.substring(0, 2).toUpperCase()}
              </div>
            </td>
            <td style="padding-left: 16px; vertical-align: top;">
              <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #18181b;">
                ${job.title}
              </p>
              <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                ${job.company} - ${REMOTE_TYPE_LABELS[job.remote_type] || job.remote_type}${job.industry ? ` - ${job.industry}` : ""}
              </p>
              <p style="margin: 0 0 6px; font-size: 14px; font-weight: 600; color: #10b981;">
                ${formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
              </p>
              ${enrichmentBadges ? `<p style="margin:0;">${enrichmentBadges}</p>` : ""}
            </td>
            <td style="width: 100px; vertical-align: middle; text-align: right;">
              <a href="${origin}/prime-jobs/${job.id}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                Ver Vaga
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
  }).join("");
}

function buildUpgradePromptHtml(totalJobs: number, origin: string): string {
  return `
  <tr>
    <td style="padding: 24px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; margin-top: 16px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #92400e;">
              +${totalJobs - 3} vagas exclusivas esta semana
            </p>
            <p style="margin: 0 0 16px; font-size: 14px; color: #a16207;">
              Faca upgrade para VIP ou Pro e tenha acesso completo a todas as vagas remotas em empresas americanas.
            </p>
            <a href="${origin}/catalogo" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700;">
              Ver Planos
            </a>
          </td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Fallback HTML (used if template not found in DB) ──────────────
function buildFallbackHtml(vars: Record<string, string>): string {
  let html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
        <tr><td style="background-color:#ffffff;padding:24px 30px 8px;text-align:center;">
          <img src="https://hub.euanapratica.com/logo-enp.png" alt="EUA Na Pratica" width="160" style="max-width:160px;height:auto;display:inline-block;" />
        </td></tr>
        <tr><td style="background:linear-gradient(135deg,#1e3a8a,#1d4ed8);padding:48px 30px;text-align:center;">
          <h1 style="color:#fff;margin:0 0 8px;font-size:28px;font-weight:800;">Prime Jobs</h1>
          <p style="color:#93c5fd;margin:0;font-size:16px;">{{jobCount}} novas vagas remotas esta semana</p>
        </td></tr>
        <tr><td style="padding:32px 30px;">
          <p style="color:#52525b;font-size:16px;line-height:1.6;margin:0 0 24px;">Ola <strong>{{recipientName}}</strong>,</p>
          <p style="color:#52525b;font-size:16px;line-height:1.6;margin:0 0 24px;">Confira as vagas remotas em empresas americanas mais recentes para voce:</p>
          <table width="100%" cellpadding="0" cellspacing="0">{{jobCardsHtml}}</table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">{{upgradePromptHtml}}</table>
          <div style="text-align:center;margin:32px 0;">
            <a href="{{allJobsLink}}" style="display:inline-block;background:#18181b;color:#fff;text-decoration:none;padding:16px 32px;border-radius:12px;font-weight:700;font-size:16px;">Ver Todas as Vagas</a>
          </div>
          <div style="background-color:#f0fdf4;border-radius:12px;padding:16px;margin:24px 0;border:1px solid #bbf7d0;">
            <p style="color:#166534;font-size:14px;font-weight:600;margin:0 0 8px;">Dica da semana</p>
            <p style="color:#15803d;font-size:14px;margin:0;">{{weeklyTip}}</p>
          </div>
        </td></tr>
        <tr><td style="background-color:#fafafa;padding:24px 30px;text-align:center;border-top:1px solid #e4e4e7;">
          <p style="color:#a1a1aa;font-size:12px;margin:0 0 8px;">Voce recebe este email porque esta inscrito no Prime Jobs.</p>
          <p style="color:#a1a1aa;font-size:12px;margin:0;">&copy; 2026 EUA Na Pratica. Todos os direitos reservados.</p>
          {{unsubscribeSection}}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  for (const [key, value] of Object.entries(vars)) {
    html = html.replace(new RegExp(escapeRegex(key), "g"), value);
  }
  return html;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  // requireAdmin also accepts x-internal-secret (cron), so this works for both admin UI and cron
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendConfig = await getApiConfig("resend_email");

    let requestBody: DigestRequest = {};
    try {
      const rawBody = await req.text();
      console.log("send-prime-jobs-digest raw body:", rawBody);
      if (rawBody) {
        requestBody = JSON.parse(rawBody);
      }
    } catch (parseErr) {
      console.error("send-prime-jobs-digest body parse error:", parseErr);
    }

    const { test_email, user_ids } = requestBody;
    console.log("send-prime-jobs-digest test_email:", test_email, "user_ids:", user_ids);

    if (!resendConfig?.credentials?.api_key) {
      return new Response(
        JSON.stringify({ success: false, message: "Email not configured", emailsSent: 0 }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch new jobs from the past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: newJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, company, logo_url, location, remote_type, salary_min, salary_max, salary_currency, industry, ai_enrichment, created_at")
      .eq("is_active", true)
      .gte("created_at", oneWeekAgo.toISOString())
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15);

    if (jobsError) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch jobs" }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    if (!newJobs || newJobs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new jobs this week", emailsSent: 0 }),
        { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Fetch email template from DB
    const { data: templateRows } = await supabase.rpc(
      "get_email_template_by_name",
      { p_template_name: "prime_jobs_digest" }
    );
    const template = templateRows && templateRows.length > 0 ? templateRows[0] : null;

    // Build recipients list — skip subscriber query entirely for test_email
    let recipients: { email: string; full_name: string; isPremium: boolean }[];

    if (test_email) {
      recipients = [{ email: test_email, full_name: "Test User", isPremium: true }];
    } else {
      let subQuery = supabase
        .from("user_subscriptions")
        .select("user_id, plan_id, plans(id, features)")
        .eq("status", "active");

      if (user_ids && user_ids.length > 0) {
        subQuery = subQuery.in("user_id", user_ids);
      }

      const { data: subs, error: subsError } = await subQuery;

      if (subsError) {
        console.error("send-prime-jobs-digest subs error:", subsError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch subscriptions", details: subsError.message }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      if (!subs || subs.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No active subscribers", emailsSent: 0 }),
          { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      const subUserIds = subs.map((s: any) => s.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", subUserIds);

      if (profilesError) {
        console.error("send-prime-jobs-digest profiles error:", profilesError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch profiles", details: profilesError.message }),
          { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      recipients = subs.map((sub: any) => {
        const profile = profileMap.get(sub.user_id);
        if (!profile?.email) return null;
        const planId = sub.plan_id || "basic";
        const isPremium = planId === "pro" || planId === "vip";
        return {
          email: profile.email,
          full_name: profile.full_name,
          isPremium,
        };
      }).filter(Boolean) as { email: string; full_name: string; isPremium: boolean }[];

      if (recipients.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: "No eligible recipients", emailsSent: 0 }),
          { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
        );
      }
    }

    let emailsSent = 0;
    let emailsFailed = 0;
    let emailsSkipped = 0;
    let lastError = "";

    const origin = "https://hub.euanapratica.com";

    const TEMPLATE_NAME = "prime_jobs_digest";

    for (const recipient of recipients) {
      try {
        if (await isUnsubscribed(supabase, recipient.email)) {
          emailsSkipped++;
          continue;
        }

        // FREE users see 3 jobs, Premium users see 10
        const jobsToShow = recipient.isPremium
          ? (newJobs as JobForDigest[]).slice(0, 10)
          : (newJobs as JobForDigest[]).slice(0, 3);

        const totalJobsAvailable = newJobs.length;
        const showUpgradePrompt = !recipient.isPremium && totalJobsAvailable > 3;

        // Pre-render dynamic HTML blocks
        const jobCardsHtml = buildJobCardsHtml(jobsToShow, origin);
        const upgradePromptHtml = showUpgradePrompt
          ? buildUpgradePromptHtml(totalJobsAvailable, origin)
          : "";

        // Generate unsubscribe link
        let unsubscribeSection = "";
        try {
          const token = await generateUnsubscribeToken(supabase, recipient.email);
          const link = generateUnsubscribeLink(token);
          unsubscribeSection = `<p style="margin: 8px 0 0;"><a href="${link}" style="color: #a1a1aa; font-size: 11px; text-decoration: underline;">Cancelar inscricao</a></p>`;
        } catch { /* non-blocking */ }

        // Build template variables
        const vars: Record<string, string> = {
          "{{recipientName}}": recipient.full_name || "Assinante",
          "{{jobCount}}": String(newJobs.length),
          "{{jobCardsHtml}}": jobCardsHtml,
          "{{upgradePromptHtml}}": upgradePromptHtml,
          "{{allJobsLink}}": `${origin}/prime-jobs`,
          "{{weeklyTip}}": getWeeklyTip(newJobs as JobForDigest[]),
          "{{unsubscribeSection}}": unsubscribeSection,
        };

        // Apply variables to template (DB or fallback)
        let subject: string;
        let body: string;

        if (template && template.enabled !== false) {
          subject = template.subject;
          body = template.body_html;
          for (const [key, value] of Object.entries(vars)) {
            const regex = new RegExp(escapeRegex(key), "g");
            subject = subject.replace(regex, value);
            body = body.replace(regex, value);
          }
        } else {
          subject = `${newJobs.length} novas vagas remotas esta semana | Prime Jobs`;
          body = buildFallbackHtml(vars);
        }

        const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendConfig.credentials.api_key}`,
          },
          body: JSON.stringify({
            from: "EUA Na Pratica <noreply@euanapratica.com>",
            to: [recipient.email],
            subject,
            html: body,
          }),
        });

        const responseBody = await emailResponse.text();

        if (emailResponse.ok) {
          const emailResult = JSON.parse(responseBody);
          emailsSent++;
          await logToEmailLogs(supabase, TEMPLATE_NAME, recipient.email, subject, "sent", null, emailResult.id);
        } else {
          emailsFailed++;
          lastError = `Resend HTTP ${emailResponse.status}: ${responseBody.slice(0, 200)}`;
          await logToEmailLogs(supabase, TEMPLATE_NAME, recipient.email, subject, "failed", lastError);
        }
      } catch (emailError) {
        emailsFailed++;
        lastError = emailError instanceof Error ? emailError.message : String(emailError);
        console.error(`Digest error for ${recipient?.email}:`, lastError);
        await logToEmailLogs(supabase, TEMPLATE_NAME, recipient?.email || "unknown", "Prime Jobs Digest", "failed", lastError);
      }
    }

    // Update automation stats (best-effort)
    await updateAutomationStats(supabase, TEMPLATE_NAME, emailsSent, emailsSkipped);

    return new Response(
      JSON.stringify({
        success: emailsSent > 0,
        message: emailsSent > 0
          ? `Digest sent to ${emailsSent} recipients`
          : lastError
            ? `Email failed: ${lastError}`
            : emailsSkipped > 0
              ? `Recipient skipped (unsubscribed)`
              : `No emails sent`,
        emailsSent,
        emailsFailed,
        emailsSkipped,
        totalJobs: newJobs.length,
        totalRecipients: recipients.length,
        testEmailReceived: test_email || null,
        templateSource: template ? "database" : "fallback",
        ...(lastError ? { lastError } : {}),
      }),
      { status: 200, headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-prime-jobs-digest error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});

// ── Helpers ─────────────────────────────────────────────────────────

async function logToEmailLogs(
  supabase: SupabaseClient,
  templateName: string,
  recipient: string,
  subject: string,
  status: string,
  errorMessage?: string | null,
  resendId?: string
) {
  try {
    await supabase.from("email_logs").insert({
      template_name: templateName,
      recipient,
      subject,
      status,
      error_message: errorMessage || null,
      resend_id: resendId || null,
    });
  } catch { /* never block */ }
}

async function updateAutomationStats(
  supabase: SupabaseClient,
  templateName: string,
  sent: number,
  skipped: number
) {
  try {
    const { data: automation } = await supabase
      .from("email_automations")
      .select("id, total_sent, total_skipped")
      .eq("template_name", templateName)
      .maybeSingle();

    if (automation) {
      await supabase
        .from("email_automations")
        .update({
          total_sent: (automation.total_sent || 0) + sent,
          total_skipped: (automation.total_skipped || 0) + skipped,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", automation.id);
    }
  } catch { /* never block */ }
}
