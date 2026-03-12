/**
 * Process Email Automations
 *
 * Handles automated trigger-based email campaigns and drip sequences.
 *
 * Auth: requireAdmin (admin JWT + x-internal-secret for cron/triggers)
 *
 * Modes:
 *   { mode: "cron_daily" }                — Run daily cron automations
 *   { mode: "cron_weekly" }               — Run weekly cron automations
 *   { mode: "drip_processor" }            — Process due drip steps
 *   { mode: "trigger", trigger_event, payload } — Event-based trigger
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";
import {
  sendCampaignEmail,
  isUnsubscribed,
} from "../_shared/emailCampaignService.ts";
import { formatLeadFirstName } from "../_shared/nameUtils.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const authError = await requireAdmin(req);
  if (authError) return authError;

  const jsonHeaders = { ...cors, "Content-Type": "application/json" };

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const mode = body.mode;

    if (mode === "cron_daily") {
      return await handleCronAutomations(supabase, "daily", jsonHeaders);
    }

    if (mode === "cron_weekly") {
      return await handleCronAutomations(supabase, "weekly", jsonHeaders);
    }

    if (mode === "drip_processor") {
      return await handleDripProcessor(supabase, jsonHeaders);
    }

    if (mode === "trigger") {
      return await handleTrigger(supabase, body.trigger_event, body.payload || {}, jsonHeaders);
    }

    return json({ error: "Invalid mode" }, 400, jsonHeaders);
  } catch (error) {
    console.error("process-email-automations error:", error);
    return json(
      { error: error instanceof Error ? error.message : "Internal error" },
      500,
      { ...cors, "Content-Type": "application/json" }
    );
  }
});

// =============================================
// CRON AUTOMATIONS (daily/weekly)
// =============================================

async function handleCronAutomations(
  supabase: SupabaseClient,
  cronType: string,
  headers: Record<string, string>
) {
  const { data: automations } = await supabase
    .from("email_automations")
    .select("*")
    .eq("trigger_type", "cron")
    .eq("trigger_cron", cronType)
    .eq("enabled", true);

  if (!automations?.length) {
    return json({ message: `No ${cronType} automations active`, results: [] }, 200, headers);
  }

  const results: any[] = [];

  for (const automation of automations) {
    try {
      const recipients = await findCronRecipients(supabase, automation);
      let sent = 0;
      let skipped = 0;

      for (const recipient of recipients) {
        if (await isUnsubscribed(supabase, recipient.email)) {
          skipped++;
          continue;
        }

        // Check if already sent this template recently (dedup)
        if (await wasRecentlySent(supabase, recipient.email, automation.template_name, automation.trigger_condition)) {
          skipped++;
          continue;
        }

        if (automation.is_drip) {
          // Enroll in drip sequence
          await enrollInDrip(supabase, automation, recipient);
          sent++;
        } else {
          // Single-step: send immediately
          const result = await sendCampaignEmail(supabase, {
            templateName: automation.template_name,
            to: recipient.email,
            variables: {
              ...(automation.template_variables || {}),
              ...recipient.variables,
            },
            automationId: automation.id,
          });

          if (result.emailSent) sent++;
          else skipped++;
        }
      }

      // Update automation stats
      await supabase
        .from("email_automations")
        .update({
          total_sent: (automation.total_sent || 0) + sent,
          total_skipped: (automation.total_skipped || 0) + skipped,
          last_triggered_at: new Date().toISOString(),
        })
        .eq("id", automation.id);

      results.push({
        automation: automation.name,
        recipients_found: recipients.length,
        sent,
        skipped,
      });
    } catch (error) {
      console.error(`Automation ${automation.name} error:`, error);
      results.push({
        automation: automation.name,
        error: error instanceof Error ? error.message : "Error",
      });
    }
  }

  return json({ message: `${cronType} automations processed`, results }, 200, headers);
}

// =============================================
// DRIP PROCESSOR (every 15 min)
// =============================================

async function handleDripProcessor(
  supabase: SupabaseClient,
  headers: Record<string, string>
) {
  const now = new Date().toISOString();

  // Get enrollments with due steps
  const { data: enrollments } = await supabase
    .from("email_drip_enrollments")
    .select("*, email_automations(*)")
    .eq("status", "active")
    .lte("next_send_at", now)
    .limit(50);

  if (!enrollments?.length) {
    return json({ message: "No drip steps due", processed: 0 }, 200, headers);
  }

  let processed = 0;
  let sent = 0;
  let completed = 0;

  for (const enrollment of enrollments) {
    processed++;
    const automation = enrollment.email_automations;
    if (!automation?.enabled) continue;

    const dripSteps = automation.drip_steps || [];
    const currentStep = enrollment.current_step;

    if (currentStep >= dripSteps.length) {
      // All steps completed
      await supabase
        .from("email_drip_enrollments")
        .update({ status: "completed" })
        .eq("id", enrollment.id);
      completed++;
      continue;
    }

    // Check unsubscribe
    if (await isUnsubscribed(supabase, enrollment.email)) {
      await supabase
        .from("email_drip_enrollments")
        .update({ status: "cancelled" })
        .eq("id", enrollment.id);
      continue;
    }

    // Check conversion: stop Free drip if user subscribed (Pro/VIP)
    if (automation.metadata?.stop_on_subscription) {
      const converted = await hasActiveSubscription(supabase, enrollment.email, enrollment.user_id);
      if (converted) {
        await supabase
          .from("email_drip_enrollments")
          .update({ status: "completed", metadata: { stopped_reason: "converted_to_subscriber" } })
          .eq("id", enrollment.id);
        completed++;
        continue;
      }
    }

    const step = dripSteps[currentStep];

    // Build step variables
    const fullName = enrollment.recipient_name || "Cliente";
    const stepVars: Record<string, string> = {
      ...(automation.template_variables || {}),
      "{{recipientName}}": fullName,
      "{{firstName}}": fullName.split(" ")[0] || "Aluno(a)",
      "{{leadName}}": formatLeadFirstName(fullName),
      "{{recipientEmail}}": enrollment.email,
      "{{stepNumber}}": String(currentStep + 1),
      "{{totalSteps}}": String(dripSteps.length),
    };

    // Resolve lead-specific variables (reportLink) from career_evaluations
    if (enrollment.lead_id) {
      const { data: lead } = await supabase
        .from("career_evaluations")
        .select("access_token")
        .eq("id", enrollment.lead_id)
        .maybeSingle();
      if (lead?.access_token) {
        stepVars["{{reportLink}}"] = `https://hub.euanapratica.com/report/${lead.access_token}`;
      }
    }

    // Send the step's email
    const result = await sendCampaignEmail(supabase, {
      templateName: step.template_name,
      to: enrollment.email,
      variables: stepVars,
      automationId: automation.id,
    });

    const nextStep = currentStep + 1;
    const stepsCompleted = [
      ...(enrollment.steps_completed || []),
      {
        step: currentStep,
        template_name: step.template_name,
        sent_at: new Date().toISOString(),
        email_sent: result.emailSent,
      },
    ];

    if (nextStep >= dripSteps.length) {
      // Last step done
      await supabase
        .from("email_drip_enrollments")
        .update({
          current_step: nextStep,
          status: "completed",
          steps_completed: stepsCompleted,
        })
        .eq("id", enrollment.id);
      completed++;
    } else {
      // Advance to next step
      const nextDelayDays = dripSteps[nextStep].delay_days || 1;
      const nextSendAt = new Date();
      nextSendAt.setDate(nextSendAt.getDate() + nextDelayDays);

      await supabase
        .from("email_drip_enrollments")
        .update({
          current_step: nextStep,
          next_send_at: nextSendAt.toISOString(),
          steps_completed: stepsCompleted,
        })
        .eq("id", enrollment.id);
    }

    if (result.emailSent) {
      sent++;

      // Log to lead_interactions for CRM timeline (best-effort)
      if (enrollment.lead_id) {
        try {
          await supabase
            .from("lead_interactions" as any)
            .insert({
              lead_id: enrollment.lead_id,
              type: "email_sent",
              content: `Email drip: ${step.template_name} (step ${currentStep + 1}/${dripSteps.length})`,
              direction: "outbound",
              channel: "email",
              metadata: {
                template_name: step.template_name,
                email_sent: true,
                recipient: enrollment.email,
                automation_name: automation.name,
                step_number: currentStep + 1,
                total_steps: dripSteps.length,
                source: "drip_processor",
              },
            } as any);
        } catch (_) {
          // best-effort, don't block drip processing
        }
      }
    }

    // Update automation stats
    await supabase
      .from("email_automations")
      .update({
        total_sent: (automation.total_sent || 0) + (result.emailSent ? 1 : 0),
        last_triggered_at: new Date().toISOString(),
      })
      .eq("id", automation.id);
  }

  return json({ message: "Drip processor complete", processed, sent, completed }, 200, headers);
}

// =============================================
// EVENT TRIGGER
// =============================================

async function handleTrigger(
  supabase: SupabaseClient,
  triggerEvent: string,
  payload: Record<string, unknown>,
  headers: Record<string, string>
) {
  if (!triggerEvent) {
    return json({ error: "trigger_event required" }, 400, headers);
  }

  // Find matching automations (exact + wildcard)
  const { data: automations } = await supabase
    .from("email_automations")
    .select("*")
    .eq("trigger_type", "event")
    .eq("enabled", true);

  const matching = (automations || []).filter((a: any) => {
    if (a.trigger_event === triggerEvent) return true;
    // Wildcard: "subscription.*" matches "subscription.activated"
    if (a.trigger_event?.endsWith(".*")) {
      const prefix = a.trigger_event.slice(0, -2);
      return triggerEvent.startsWith(prefix + ".");
    }
    return false;
  });

  if (!matching.length) {
    return json({ message: "No automations match event", event: triggerEvent }, 200, headers);
  }

  const results: any[] = [];

  for (const automation of matching) {
    try {
      // Determine recipient from payload
      const email = (payload.email || payload.lead_email) as string;
      if (!email) {
        results.push({ automation: automation.name, skipped: "no email in payload" });
        continue;
      }

      if (await isUnsubscribed(supabase, email)) {
        results.push({ automation: automation.name, skipped: "unsubscribed" });
        continue;
      }

      const recipientName = (payload.lead_name || payload.user_name || "Cliente") as string;
      const firstName = recipientName.split(" ")[0] || "Aluno(a)";
      const variables: Record<string, string> = {
        ...(automation.template_variables || {}),
        "{{recipientName}}": recipientName,
        "{{firstName}}": firstName,
        "{{recipientEmail}}": email,
      };

      // Add payload variables
      if (payload.access_token) {
        variables["{{reportLink}}"] = `https://hub.euanapratica.com/report/${payload.access_token}`;
      }
      if (payload.lead_name) variables["{{leadName}}"] = formatLeadFirstName(payload.lead_name as string);
      if (payload.plan_name) variables["{{planName}}"] = payload.plan_name as string;
      if (payload.milestone) variables["{{milestone}}"] = String(payload.milestone);

      if (automation.is_drip) {
        // Enroll in drip (will skip if already enrolled via UNIQUE constraint)
        const enrolled = await enrollInDrip(supabase, automation, {
          email,
          user_id: payload.user_id as string,
          lead_id: (payload.lead_id || payload.evaluation_id) as string,
          recipient_name: recipientName,
          variables,
        });
        results.push({ automation: automation.name, enrolled });
      } else {
        // Single-step: send immediately
        const result = await sendCampaignEmail(supabase, {
          templateName: automation.template_name,
          to: email,
          variables,
          automationId: automation.id,
        });

        // Update stats
        await supabase
          .from("email_automations")
          .update({
            total_sent: (automation.total_sent || 0) + (result.emailSent ? 1 : 0),
            last_triggered_at: new Date().toISOString(),
          })
          .eq("id", automation.id);

        results.push({ automation: automation.name, sent: result.emailSent });
      }
    } catch (error) {
      results.push({
        automation: automation.name,
        error: error instanceof Error ? error.message : "Error",
      });
    }
  }

  return json({ message: "Trigger processed", event: triggerEvent, results }, 200, headers);
}

// =============================================
// CONDITION EVALUATORS (for cron automations)
// =============================================

interface Recipient {
  email: string;
  user_id?: string;
  lead_id?: string;
  recipient_name?: string;
  variables: Record<string, string>;
}

async function findCronRecipients(
  supabase: SupabaseClient,
  automation: any
): Promise<Recipient[]> {
  const condition = automation.trigger_condition || {};
  const name = automation.name;

  // Route to the right evaluator based on automation name/condition
  if (condition.lead_temperature) return findHotLeadsNoConversion(supabase, condition);
  if (condition.min_inactive_days) return findInactiveSubscribers(supabase, condition);
  if (condition.days_before_billing) return findRenewalReminders(supabase, condition);
  if (condition.days_since_cancelled) return findWinbackCandidates(supabase, condition);
  if (condition.min_report_age_days) return findColdLeads(supabase, condition);
  if (condition.booking_completed_hours_ago) return findPostBookingFollowups(supabase, condition);

  console.warn(`No evaluator for automation: ${name}`);
  return [];
}

// Automation 2: Leads quentes sem conversao
async function findHotLeadsNoConversion(
  supabase: SupabaseClient,
  condition: any
): Promise<Recipient[]> {
  const temps = condition.lead_temperature || ["quente", "muito-quente"];
  const minAgeHours = condition.min_age_hours || 48;

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - minAgeHours);

  const { data: leads } = await supabase
    .from("career_evaluations")
    .select("id, name, email, access_token, lead_temperature")
    .eq("processing_status", "completed")
    .not("email", "is", null)
    .in("lead_temperature", temps)
    .lt("created_at", cutoff.toISOString())
    .limit(50);

  if (!leads?.length) return [];

  // Filter out those who already have active subscriptions
  const recipients: Recipient[] = [];
  for (const lead of leads) {
    // Check if lead has an active subscription (by email match in profiles)
    const { data: sub } = await supabase
      .from("profiles")
      .select("id, user_subscriptions!inner(status)")
      .eq("email", lead.email)
      .eq("user_subscriptions.status", "active")
      .maybeSingle();

    if (sub) continue; // Has active subscription, skip

    recipients.push({
      email: lead.email,
      lead_id: lead.id,
      recipient_name: lead.name,
      variables: {
        "{{leadName}}": formatLeadFirstName(lead.name),
        "{{reportLink}}": lead.access_token
          ? `https://hub.euanapratica.com/report/${lead.access_token}`
          : "",
        "{{leadTemperature}}": lead.lead_temperature || "",
      },
    });
  }

  return recipients;
}

// Automation 4: Assinante inativo
async function findInactiveSubscribers(
  supabase: SupabaseClient,
  condition: any
): Promise<Recipient[]> {
  const minInactiveDays = condition.min_inactive_days || 14;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - minInactiveDays);

  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("user_id, profiles!inner(full_name, email), plans(name)")
    .eq("status", "active")
    .limit(100);

  if (!subs?.length) return [];

  const recipients: Recipient[] = [];
  for (const sub of subs) {
    const profile = (sub as any).profiles;
    if (!profile?.email) continue;

    // Check recent usage
    const { count } = await supabase
      .from("usage_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", sub.user_id)
      .gt("created_at", cutoff.toISOString());

    if ((count || 0) > 0) continue; // Active user, skip

    recipients.push({
      email: profile.email,
      user_id: sub.user_id,
      recipient_name: profile.full_name,
      variables: {
        "{{userName}}": profile.full_name || "Assinante",
        "{{planName}}": (sub as any).plans?.name || "",
        "{{inactiveDays}}": String(minInactiveDays),
      },
    });
  }

  return recipients;
}

// Automation 6: Renewal reminder
async function findRenewalReminders(
  supabase: SupabaseClient,
  condition: any
): Promise<Recipient[]> {
  const daysBefore = condition.days_before_billing || 7;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + daysBefore);
  const targetDateStr = targetDate.toISOString().split("T")[0]; // YYYY-MM-DD

  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("user_id, next_billing_date, profiles!inner(full_name, email), plans(name)")
    .eq("status", "active")
    .gte("next_billing_date", `${targetDateStr}T00:00:00`)
    .lt("next_billing_date", `${targetDateStr}T23:59:59`)
    .limit(100);

  return (subs || []).map((sub: any) => ({
    email: sub.profiles.email,
    user_id: sub.user_id,
    recipient_name: sub.profiles.full_name,
    variables: {
      "{{userName}}": sub.profiles.full_name || "Assinante",
      "{{planName}}": sub.plans?.name || "",
      "{{renewalDate}}": new Date(sub.next_billing_date).toLocaleDateString("pt-BR"),
    },
  }));
}

// Automation 7: Win-back
async function findWinbackCandidates(
  supabase: SupabaseClient,
  condition: any
): Promise<Recipient[]> {
  const daysSinceCancelled = condition.days_since_cancelled || 30;

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysSinceCancelled);
  const targetDateStr = targetDate.toISOString().split("T")[0];

  const { data: subs } = await supabase
    .from("user_subscriptions")
    .select("user_id, canceled_at, profiles!inner(full_name, email), plans(name)")
    .eq("status", "cancelled")
    .gte("canceled_at", `${targetDateStr}T00:00:00`)
    .lt("canceled_at", `${targetDateStr}T23:59:59`)
    .limit(50);

  if (!subs?.length) return [];

  // Filter out those who resubscribed
  const recipients: Recipient[] = [];
  for (const sub of subs) {
    const { count } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", sub.user_id)
      .eq("status", "active");

    if ((count || 0) > 0) continue; // Resubscribed

    recipients.push({
      email: (sub as any).profiles.email,
      user_id: sub.user_id,
      recipient_name: (sub as any).profiles.full_name,
      variables: {
        "{{userName}}": (sub as any).profiles.full_name || "Ex-assinante",
        "{{planName}}": (sub as any).plans?.name || "",
      },
    });
  }

  return recipients;
}

// Automation 8: Reengajamento frio
async function findColdLeads(
  supabase: SupabaseClient,
  condition: any
): Promise<Recipient[]> {
  const minAgeDays = condition.min_report_age_days || 30;
  const noEmailDays = condition.no_recent_email_days || 30;

  const ageCutoff = new Date();
  ageCutoff.setDate(ageCutoff.getDate() - minAgeDays);

  const emailCutoff = new Date();
  emailCutoff.setDate(emailCutoff.getDate() - noEmailDays);

  const { data: leads } = await supabase
    .from("career_evaluations")
    .select("id, name, email, access_token")
    .eq("processing_status", "completed")
    .not("email", "is", null)
    .lt("created_at", ageCutoff.toISOString())
    .limit(100);

  if (!leads?.length) return [];

  const recipients: Recipient[] = [];
  for (const lead of leads) {
    // Check if we sent any email recently
    const { count } = await supabase
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .eq("recipient", lead.email)
      .gt("created_at", emailCutoff.toISOString());

    if ((count || 0) > 0) continue;

    recipients.push({
      email: lead.email,
      lead_id: lead.id,
      recipient_name: lead.name,
      variables: {
        "{{leadName}}": formatLeadFirstName(lead.name),
        "{{reportLink}}": lead.access_token
          ? `https://hub.euanapratica.com/report/${lead.access_token}`
          : "",
      },
    });
  }

  return recipients;
}

// Automation 9: Follow-up pos-consultoria
async function findPostBookingFollowups(
  supabase: SupabaseClient,
  condition: any
): Promise<Recipient[]> {
  const hoursAgo = condition.booking_completed_hours_ago || 24;

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - hoursAgo - 1);
  const windowEnd = new Date();
  windowEnd.setHours(windowEnd.getHours() - hoursAgo + 1);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("student_id, scheduled_start, profiles!bookings_student_id_fkey(full_name, email)")
    .eq("status", "completed")
    .gte("scheduled_start", windowStart.toISOString())
    .lte("scheduled_start", windowEnd.toISOString())
    .limit(50);

  if (!bookings?.length) return [];

  const recipients: Recipient[] = [];
  for (const booking of bookings) {
    const profile = (booking as any).profiles;
    if (!profile?.email) continue;

    // Check if already has active subscription
    const { count } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", booking.student_id)
      .eq("status", "active");

    if ((count || 0) > 0) continue;

    recipients.push({
      email: profile.email,
      user_id: booking.student_id,
      recipient_name: profile.full_name,
      variables: {
        "{{userName}}": profile.full_name || "Cliente",
      },
    });
  }

  return recipients;
}

// =============================================
// HELPERS
// =============================================

async function enrollInDrip(
  supabase: SupabaseClient,
  automation: any,
  recipient: Recipient
): Promise<boolean> {
  const dripSteps = automation.drip_steps || [];
  if (!dripSteps.length) return false;

  const firstStep = dripSteps[0];
  const nextSendAt = new Date();
  nextSendAt.setDate(nextSendAt.getDate() + (firstStep.delay_days || 0));

  const { error } = await supabase
    .from("email_drip_enrollments")
    .upsert(
      {
        automation_id: automation.id,
        email: recipient.email.toLowerCase().trim(),
        user_id: recipient.user_id || null,
        lead_id: recipient.lead_id || null,
        recipient_name: recipient.recipient_name || null,
        current_step: 0,
        next_send_at: nextSendAt.toISOString(),
        status: "active",
        steps_completed: [],
      },
      { onConflict: "automation_id,email", ignoreDuplicates: true }
    );

  return !error;
}

async function hasActiveSubscription(
  supabase: SupabaseClient,
  email: string,
  userId?: string | null
): Promise<boolean> {
  // Check by user_id first (faster, direct FK)
  if (userId) {
    const { count } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "active");
    if ((count || 0) > 0) return true;
  }

  // Fallback: check by email via profiles join
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .maybeSingle();

  if (profile) {
    const { count } = await supabase
      .from("user_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "active");
    return (count || 0) > 0;
  }

  return false;
}

async function wasRecentlySent(
  supabase: SupabaseClient,
  email: string,
  templateName: string,
  condition: any
): Promise<boolean> {
  // Determine lookback window
  const lookbackDays = condition.no_recent_email_days || condition.days_since_cancelled || 7;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - lookbackDays);

  const { count } = await supabase
    .from("email_logs")
    .select("id", { count: "exact", head: true })
    .eq("recipient", email)
    .eq("template_name", templateName)
    .eq("status", "sent")
    .gt("created_at", cutoff.toISOString());

  return (count || 0) > 0;
}

function json(data: any, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(data), { status, headers });
}
