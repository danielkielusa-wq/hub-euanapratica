import { createClient } from "https://esm.sh/@supabase/supabase-js@2.91.1";
import { getApiConfig } from "../_shared/apiConfigService.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DigestRequest {
  test_email?: string; // Optional: send to specific email for testing
  user_ids?: string[]; // Optional: send to specific users only
}

interface JobForDigest {
  id: string;
  title: string;
  company_name: string;
  company_logo_url: string | null;
  location: string;
  remote_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  created_at: string;
}

const REMOTE_TYPE_LABELS: Record<string, string> = {
  fully_remote: "100% Remoto",
  hybrid: "Híbrido",
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
  if (max) return `Até ${formatter.format(max)}`;
  return "A combinar";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Resend config from database
    const resendConfig = await getApiConfig("resend_email");

    // Parse request body (optional parameters)
    let requestBody: DigestRequest = {};
    try {
      requestBody = await req.json();
    } catch {
      // No body provided, use defaults
    }

    const { test_email, user_ids } = requestBody;

    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured - emails will not be sent");
      return new Response(
        JSON.stringify({ success: false, message: "Email not configured", emailsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch new jobs from the past 7 days
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: newJobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, company_name, company_logo_url, location, remote_type, salary_min, salary_max, salary_currency, created_at")
      .eq("is_active", true)
      .gte("created_at", oneWeekAgo.toISOString())
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(15);

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch jobs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!newJobs || newJobs.length === 0) {
      console.log("No new jobs this week, skipping digest");
      return new Response(
        JSON.stringify({ success: true, message: "No new jobs this week", emailsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${newJobs.length} new jobs this week`);

    // Build user query
    let userQuery = supabase
      .from("profiles")
      .select(`
        id,
        full_name,
        email,
        role,
        user_subscriptions!inner(
          plan_id,
          status,
          plans!inner(
            id,
            features
          )
        )
      `)
      .eq("role", "student")
      .eq("user_subscriptions.status", "active");

    if (user_ids && user_ids.length > 0) {
      userQuery = userQuery.in("id", user_ids);
    }

    const { data: users, error: usersError } = await userQuery;

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch users" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If test_email is provided, send only to that email
    const recipients = test_email
      ? [{ email: test_email, full_name: "Test User", isPremium: true }]
      : (users || []).map((user: any) => {
          const planId = user.user_subscriptions?.[0]?.plan_id || "basic";
          const isPremium = planId === "pro" || planId === "vip";
          return {
            email: user.email,
            full_name: user.full_name,
            isPremium,
          };
        });

    if (recipients.length === 0) {
      console.log("No eligible recipients found");
      return new Response(
        JSON.stringify({ success: true, message: "No eligible recipients", emailsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending digest to ${recipients.length} recipients`);

    let emailsSent = 0;
    let emailsFailed = 0;

    const origin = req.headers.get("origin") || "https://hub-euanapratica.vercel.app";

    for (const recipient of recipients) {
      try {
        // FREE users see 3 jobs, Premium users see 10
        const jobsToShow = recipient.isPremium
          ? (newJobs as JobForDigest[]).slice(0, 10)
          : (newJobs as JobForDigest[]).slice(0, 3);

        const totalJobsAvailable = newJobs.length;
        const showUpgradePrompt = !recipient.isPremium && totalJobsAvailable > 3;

        const jobCardsHtml = jobsToShow.map((job: JobForDigest) => `
          <tr>
            <td style="padding: 16px 0; border-bottom: 1px solid #e4e4e7;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width: 48px; vertical-align: top;">
                    <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px; text-align: center; line-height: 48px;">
                      ${job.company_name.substring(0, 2).toUpperCase()}
                    </div>
                  </td>
                  <td style="padding-left: 16px; vertical-align: top;">
                    <p style="margin: 0 0 4px; font-size: 16px; font-weight: 700; color: #18181b;">
                      ${job.title}
                    </p>
                    <p style="margin: 0 0 8px; font-size: 14px; color: #71717a;">
                      ${job.company_name} • ${REMOTE_TYPE_LABELS[job.remote_type] || job.remote_type}
                    </p>
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: #10b981;">
                      ${formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </p>
                  </td>
                  <td style="width: 100px; vertical-align: middle; text-align: right;">
                    <a href="${origin}/prime-jobs/${job.id}" style="display: inline-block; background: #18181b; color: white; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;">
                      Ver Vaga
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        `).join("");

        const upgradePromptHtml = showUpgradePrompt ? `
          <tr>
            <td style="padding: 24px; background: linear-gradient(135deg, #fef3c7, #fde68a); border-radius: 16px; margin-top: 16px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #92400e;">
                      🔒 +${totalJobsAvailable - 3} vagas exclusivas esta semana
                    </p>
                    <p style="margin: 0 0 16px; font-size: 14px; color: #a16207;">
                      Faça upgrade para VIP ou Pro e tenha acesso completo a todas as vagas remotas em empresas americanas.
                    </p>
                    <a href="${origin}/catalogo" style="display: inline-block; background: #f59e0b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px; font-weight: 700;">
                      Ver Planos →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        ` : "";

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #1e3a8a, #1d4ed8); padding: 48px 30px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 28px; font-weight: 800;">
                          📬 Prime Jobs
                        </h1>
                        <p style="color: #93c5fd; margin: 0; font-size: 16px;">
                          ${newJobs.length} novas vagas remotas esta semana
                        </p>
                      </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                      <td style="padding: 32px 30px;">
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                          Olá <strong>${recipient.full_name}</strong>,
                        </p>
                        <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
                          Confira as vagas remotas em empresas americanas mais recentes para você:
                        </p>

                        <!-- Job Cards -->
                        <table width="100%" cellpadding="0" cellspacing="0">
                          ${jobCardsHtml}
                        </table>

                        <!-- Upgrade Prompt for FREE users -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 24px;">
                          ${upgradePromptHtml}
                        </table>

                        <!-- CTA Button -->
                        <div style="text-align: center; margin: 32px 0;">
                          <a href="${origin}/prime-jobs" style="display: inline-block; background: #18181b; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-weight: 700; font-size: 16px;">
                            Ver Todas as Vagas
                          </a>
                        </div>

                        <!-- Tips -->
                        <div style="background-color: #f0fdf4; border-radius: 12px; padding: 16px; margin: 24px 0; border: 1px solid #bbf7d0;">
                          <p style="color: #166534; font-size: 14px; font-weight: 600; margin: 0 0 8px;">💡 Dica da semana</p>
                          <p style="color: #15803d; font-size: 14px; margin: 0;">
                            Personalize seu currículo para cada vaga usando nosso ResumePass AI. Candidatos com currículos personalizados têm 3x mais chances de receber retorno!
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                      <td style="background-color: #fafafa; padding: 24px 30px; text-align: center; border-top: 1px solid #e4e4e7;">
                        <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">
                          Você recebe este email porque está inscrito no Prime Jobs.
                        </p>
                        <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                          © ${new Date().getFullYear()} EUA Na Prática. Todos os direitos reservados.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `;

        const emailResponse = await fetch(`${resendConfig.base_url}/emails`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${resendConfig.credentials.api_key}`,
          },
          body: JSON.stringify({
            from: "EUA Na Prática <noreply@euanapratica.com>",
            to: [recipient.email],
            subject: `📬 ${newJobs.length} novas vagas remotas esta semana | Prime Jobs`,
            html: emailHtml,
          }),
        });

        const emailResult = await emailResponse.json();

        if (emailResponse.ok) {
          emailsSent++;
          console.log(`✅ Digest sent to: ${recipient.email}`);
        } else {
          emailsFailed++;
          console.error(`❌ Failed to send to ${recipient.email}:`, emailResult);
        }
      } catch (emailError) {
        emailsFailed++;
        console.error(`❌ Error sending to ${recipient.email}:`, emailError);
      }
    }

    console.log(`Digest complete: ${emailsSent} sent, ${emailsFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Digest sent to ${emailsSent} recipients`,
        emailsSent,
        emailsFailed,
        totalJobs: newJobs.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-prime-jobs-digest:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
