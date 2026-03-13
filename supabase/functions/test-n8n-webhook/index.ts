/**
 * test-n8n-webhook — Server-side proxy for testing N8N webhook automations.
 *
 * The admin UI cannot call N8N webhooks directly from the browser due to CORS.
 * This function receives the automation_id, builds a test payload, dispatches
 * it server-side, and returns the result.
 *
 * Auth: admin-only (requireAdmin).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { requireAdmin, getCorsHeaders } from "../_shared/authGuard.ts";

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { automation_id } = await req.json();
    if (!automation_id) {
      return new Response(JSON.stringify({ error: "automation_id required" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch automation config
    const { data: auto, error: fetchErr } = await supabase
      .from("n8n_automations")
      .select("*")
      .eq("id", automation_id)
      .single();

    if (fetchErr || !auto) {
      return new Response(JSON.stringify({ error: "Automation not found" }), {
        status: 404,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (!auto.webhook_url) {
      return new Response(JSON.stringify({ error: "Webhook URL not configured" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Build test payload
    const testPayload: Record<string, unknown> = {
      event: auto.trigger_event.replace(".*", ".test"),
      timestamp: new Date().toISOString(),
      source: "enp_hub_admin_test",
      test: true,
      lead_id: "00000000-0000-0000-0000-000000000000",
      lead_name: "Lead Teste",
      lead_email: "teste@example.com",
      lead_phone: "5511999999999",
    };

    if (auto.trigger_event === "report.generated") {
      Object.assign(testPayload, {
        access_token: "test-token-000",
        report_link: "https://hub.euanapratica.com/report/test-token-000",
        // User data (raw form answers)
        area: "Tecnologia",
        atuacao: "Desenvolvedor Full-Stack",
        experiencia: "5-10 anos",
        english_level: "avancado",
        objetivo: "Trabalhar no exterior",
        visa_status: "nenhum",
        timeline: "6-12 meses",
        family_status: "solteiro",
        income_range: "10000-15000",
        investment_range: "1000-3000",
        impediment: "networking",
        main_concern: "Validacao do curriculo internacional",
        // AI-generated scoring & qualification
        readiness_score: 78,
        lead_temperature: "quente",
        lead_priority_score: 82,
        phase_id: "decolagem",
        phase_name: "Decolagem",
        full_diagnosis: "Profissional de tech com perfil forte, precisa de orientacao estrategica para posicionamento internacional.",
        recommended_product_tier: "mentoria_individual",
        is_tech_professional: true,
        is_senior_level: true,
        is_high_income: false,
        primary_product: "Mentoria Individual 1:1",
        barriers: ["networking", "portfolio"],
      });
    } else if (auto.trigger_event === "subscription.*") {
      Object.assign(testPayload, {
        action: "activated",
        customer_email: "teste@example.com",
        customer_name: "Lead Teste",
        user_id: "00000000-0000-0000-0000-000000000000",
        plan_id: null,
        plan_name: "Pro",
        offer_id: "OFFER-TEST-000",
        ticto_status: "active",
        product_name: "ENP Hub Pro",
        paid_amount: 97.0,
      });
    } else if (auto.trigger_event === "subscription.cancelled") {
      Object.assign(testPayload, {
        user_id: "00000000-0000-0000-0000-000000000000",
        email: "teste@example.com",
        subscription_id: "00000000-0000-0000-0000-000000000000",
        plan_id: null,
        reason: "Nao estou usando o suficiente",
        feedback: "Gostei do conteudo mas preciso focar em outra coisa agora",
        was_active: true,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else if (auto.trigger_event === "analytics.daily") {
      Object.assign(testPayload, {
        snapshot_date: new Date().toISOString().slice(0, 10),
        ai_summary: "Resumo de teste gerado pelo admin.",
        dashboard_url: "https://hub.euanapratica.com/admin/analytics",
        metrics: {
          new_leads: 15,
          new_leads_yesterday: 12,
          new_signups: 3,
          active_subscriptions: 42,
          mrr_estimate: 8400,
          new_subs_today: 1,
          churn_count_30d: 3,
          churn_percent_30d: 2.4,
          revenue_today_brl: 194,
          total_credits_used: 28,
          bookings_today: 5,
          no_show_rate_30d: 8.5,
          community_posts: 8,
          community_comments: 23,
          whatsapp_outbound: 120,
          whatsapp_inbound: 34,
          email_sent: 45,
          email_success_rate: 97.2,
          page_views: 380,
          api_cost_usd: 1.23,
        },
      });
    } else if (auto.trigger_event === "whatsapp.inbound") {
      Object.assign(testPayload, {
        message_text: "SIM",
        message_id: "test-msg-000",
        interaction_id: null,
      });
    } else if (auto.trigger_event === "report.accessed") {
      Object.assign(testPayload, {
        access_token: "test-token-000",
        report_link: "https://hub.euanapratica.com/report/test-token-000",
        first_accessed_at: new Date().toISOString(),
        lead_temperature: "quente",
        lead_priority_score: 82,
        task_priority: "high",
        task_due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } else if (auto.trigger_event === "mentoria.interest") {
      Object.assign(testPayload, {
        waitlist_id: "00000000-0000-0000-0000-000000000000",
        is_new: true,
        name: "Lead Teste",
        email: "teste@example.com",
        whatsapp: "5511999999999",
        utm_source: "instagram",
        utm_campaign: "mentoria_grupo",
        enrichment: null,
      });
    } else if (auto.trigger_event === "cart.abandoned") {
      Object.assign(testPayload, {
        user_id: "00000000-0000-0000-0000-000000000000",
        email: "teste@example.com",
        name: "Lead Teste",
        service_id: "00000000-0000-0000-0000-000000000000",
        service_name: "Mentoria Individual 1:1",
        service_price: 497.0,
        checkout_url: "https://hub.euanapratica.com/checkout/test",
        viewed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        utm_source: "instagram",
        utm_medium: "stories",
        utm_campaign: "mentoria_launch",
      });
    } else if (auto.trigger_event === "manychat.trigger_flow") {
      Object.assign(testPayload, {
        flow_name: "report_ready_drip",
        flow_display_name: "Report Ready Drip",
        mc_flow_ns: "test_flow_ns",
        hsm_template_name: "report_ready_teaser",
        hsm_template_language: "pt_BR",
        hsm_template_params: [],
        variables: { lead_name: "Lead Teste" },
      });
    } else if (auto.trigger_event === "intelligence.weekly_report") {
      Object.assign(testPayload, {
        report_id: "00000000-0000-0000-0000-000000000000",
        period: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          end: new Date().toISOString().slice(0, 10),
        },
        executive_summary: "Semana com crescimento de 12% em leads qualificados. 3 novos assinantes Pro. Pipeline saudavel com 8 leads quentes.",
        hot_leads_count: 8,
        new_leads_count: 15,
        bookings_this_week: 6,
        revenue_this_week_brl: 1940,
        alerts_count: 2,
        opportunities_count: 4,
        ai_analysis: {
          executive_summary: "Semana com crescimento de 12% em leads qualificados.",
          alerts: ["Churn rate subiu 0.5%", "2 no-shows esta semana"],
          opportunities: ["Lead quente do setor financeiro", "3 leads com score > 80", "Upsell potencial mentoria VIP", "Cross-sell curriculo para assinantes Pro"],
        },
        report_url: "https://hub.euanapratica.com/admin/inteligencia-semanal",
      });
    } else if (auto.trigger_event.startsWith("sdr.")) {
      Object.assign(testPayload, {
        prospect_id: "00000000-0000-0000-0000-000000000000",
        prospect_name: "Prospect Teste",
        phone: "5511999999999",
        linkedin_url: "https://linkedin.com/in/teste",
        message: "Ola! Teste de mensagem SDR.",
      });
    } else if (auto.trigger_event === "booking.*" || auto.trigger_event === "booking.created") {
      Object.assign(testPayload, {
        booking_id: "00000000-0000-0000-0000-000000000000",
        student_id: "00000000-0000-0000-0000-000000000001",
        student_name: "Aluno Teste",
        student_email: "aluno@example.com",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        service_id: "00000000-0000-0000-0000-000000000003",
        service_name: "Mentoria Individual 1:1",
        scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        meeting_link: "https://meet.google.com/abc-defg-hij",
        student_notes: "Quero discutir meu plano de carreira.",
      });
    } else if (auto.trigger_event === "booking.cancelled" || auto.trigger_event === "booking.no_show") {
      Object.assign(testPayload, {
        booking_id: "00000000-0000-0000-0000-000000000000",
        student_id: "00000000-0000-0000-0000-000000000001",
        student_name: "Aluno Teste",
        student_email: "aluno@example.com",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        service_id: "00000000-0000-0000-0000-000000000003",
        service_name: "Mentoria Individual 1:1",
        scheduled_start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: auto.trigger_event === "booking.no_show" ? "no_show" : "cancelled",
        cancellation_reason: "Conflito de agenda",
      });
    } else if (auto.trigger_event === "booking.rescheduled") {
      Object.assign(testPayload, {
        booking_id: "00000000-0000-0000-0000-000000000000",
        student_id: "00000000-0000-0000-0000-000000000001",
        student_name: "Aluno Teste",
        student_email: "aluno@example.com",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        service_id: "00000000-0000-0000-0000-000000000003",
        service_name: "Mentoria Individual 1:1",
        old_scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        new_scheduled_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        new_scheduled_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
      });
    } else if (auto.trigger_event === "booking.completed") {
      Object.assign(testPayload, {
        booking_id: "00000000-0000-0000-0000-000000000000",
        student_id: "00000000-0000-0000-0000-000000000001",
        student_name: "Aluno Teste",
        student_email: "aluno@example.com",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        service_id: "00000000-0000-0000-0000-000000000003",
        service_name: "Mentoria Individual 1:1",
        scheduled_start: new Date().toISOString(),
        scheduled_end: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        mentor_notes: "Sessao produtiva, aluno progrediu no plano de carreira.",
        completed_at: new Date().toISOString(),
      });
    } else if (auto.trigger_event === "live.*" || auto.trigger_event === "live.created") {
      Object.assign(testPayload, {
        live_id: "00000000-0000-0000-0000-000000000000",
        title: "Como Alavancar sua Carreira em Tech",
        slug: "como-alavancar-carreira-tech",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 90,
        meeting_link: "https://meet.google.com/abc-defg-hij",
      });
    } else if (auto.trigger_event === "live.started") {
      Object.assign(testPayload, {
        live_id: "00000000-0000-0000-0000-000000000000",
        title: "Como Alavancar sua Carreira em Tech",
        slug: "como-alavancar-carreira-tech",
        meeting_link: "https://meet.google.com/abc-defg-hij",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        registration_count: 25,
        scheduled_at: new Date().toISOString(),
      });
    } else if (auto.trigger_event === "live.registration") {
      Object.assign(testPayload, {
        live_id: "00000000-0000-0000-0000-000000000000",
        title: "Como Alavancar sua Carreira em Tech",
        slug: "como-alavancar-carreira-tech",
        user_id: "00000000-0000-0000-0000-000000000001",
        user_name: "Aluno Teste",
        user_email: "aluno@example.com",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 90,
      });
    } else if (auto.trigger_event === "live.completed") {
      Object.assign(testPayload, {
        live_id: "00000000-0000-0000-0000-000000000000",
        title: "Como Alavancar sua Carreira em Tech",
        slug: "como-alavancar-carreira-tech",
        recording_url: "https://youtube.com/watch?v=test123",
        total_participants: 18,
        emails_sent: 18,
      });
    } else if (auto.trigger_event === "live.cancelled") {
      Object.assign(testPayload, {
        live_id: "00000000-0000-0000-0000-000000000000",
        title: "Como Alavancar sua Carreira em Tech",
        slug: "como-alavancar-carreira-tech",
        mentor_id: "00000000-0000-0000-0000-000000000002",
        mentor_name: "Mentor Teste",
        scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        cancellation_reason: "Mentor com compromisso urgente",
        registration_count: 12,
      });
    } else if (auto.trigger_event === "order.*" || auto.trigger_event === "order.paid") {
      Object.assign(testPayload, {
        user_id: "00000000-0000-0000-0000-000000000001",
        email: "aluno@example.com",
        product_name: "Mentoria Individual 1:1",
        product_type: "one_time_service",
        amount: 497.0,
        currency: "BRL",
        ticto_order_id: "TIC-TEST-000",
        service_id: "00000000-0000-0000-0000-000000000003",
        service_name: "Mentoria Individual 1:1",
      });
    } else if (auto.trigger_event === "group_content.generated") {
      Object.assign(testPayload, {
        id: "00000000-0000-0000-0000-000000000000",
        date: new Date().toISOString().slice(0, 10),
        model: "gpt-4o-mini",
        contents: [
          {
            type: "insight",
            title: "💡 Insight do dia",
            body: "Essa semana, 73% dos brasileiros que fizeram o diagnóstico de carreira tinham experiência forte mas currículo fraco pro mercado americano. Se você tá aplicando e não recebe retorno, talvez não seja sua qualificação — é como você tá apresentando ela."
          },
          {
            type: "question",
            title: "❓ Pergunta pro grupo",
            body: "Quem aqui já tentou traduzir o currículo pro formato americano e sentiu que \"perdeu\" experiência na tradução? Conta aí 👇"
          },
          {
            type: "cta",
            title: "🔗 Dica rápida",
            body: "Pra quem ainda não fez: tem um diagnóstico gratuito que analisa seu perfil pro mercado EUA em 5 minutos. Posso mandar o link aqui pra quem quiser."
          }
        ],
      });
      // Remove generic lead fields not relevant to this event
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    } else if (auto.trigger_event === "order.refunded") {
      Object.assign(testPayload, {
        user_id: "00000000-0000-0000-0000-000000000001",
        email: "aluno@example.com",
        product_type: "one_time_service",
        ticto_order_id: "TIC-TEST-000",
        service_id: "00000000-0000-0000-0000-000000000003",
        service_name: "Mentoria Individual 1:1",
        refund_event: "refund",
      });
    } else if (auto.trigger_event === "content.production_reminder") {
      Object.assign(testPayload, {
        piece_id: "00000000-0000-0000-0000-000000000000",
        title: "Por que seu cargo em portugues te elimina antes da entrevista",
        format: "long_video",
        tone: "polemic",
        production_date: new Date().toISOString().slice(0, 10),
        scheduled_for: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        virality_score: 85,
        growth_function: "discovery",
        hooks: "[question] Por que HR americana ignora seu curriculo no primeiro segundo?\n[provocation] Se seu cargo nao existe em ingles, voce ja perdeu a vaga.",
        full_script: "## HOOK - O Detalhe que Elimina Antes da Entrevista\nO, vem comigo que eu tenho uma historia que vai mudar como voce se ve no mercado gringo. Eu conheci um cara, desenvolvedor senior no Brasil, ganhando bem, respeitado. Mandou curriculo pra 47 vagas nos EUA. Nem uma resposta. Nada. Zero retorno. Ai ele fez uma coisa simples — mudou um nome no curriculo. So isso.\n📹 Camera frontal, close no rosto do Daniel. Expressao seria e engajada.\n\n## O Problema Real - Por Que Isso Acontece\nEntao entende o seguinte. Nos EUA, o sistema de recrutamento funciona assim: a HR coloca uma vaga, e ela nao procura por pessoas. Ela coloca um filtro. Um filtro de palavras-chave.\n📹 Camera em enquadramento medio. Daniel explicando com as maos.\n\n## Como Funciona o Title Translator - Ferramenta Pratica\nAgora vem a parte que vai resolver isso pra voce. Existe uma ferramenta — se voce nao conhece, prepare-se — chamada Title Translator. E uma plataforma que mapeia o que voce e aqui no Brasil pro exatamente o que voce e la nos EUA.\n📹 Camera mais proxima, mostrando entusiasmo. Corta para screen share.",
        cta: "Link na bio para o Title Translator — traduz seu cargo em 30 segundos",
        link: "https://hub.euanapratica.com/admin/content-pipeline?piece=00000000-0000-0000-0000-000000000000",
      });
      // Remove generic lead fields
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    } else if (auto.trigger_event === "content.publish_reminder") {
      Object.assign(testPayload, {
        piece_id: "00000000-0000-0000-0000-000000000000",
        title: "Por que seu cargo em portugues te elimina antes da entrevista",
        format: "long_video",
        status: "recorded",
        scheduled_for: new Date().toISOString(),
        cta: "Link na bio para o Title Translator — traduz seu cargo em 30 segundos",
        link: "https://hub.euanapratica.com/admin/content-pipeline?piece=00000000-0000-0000-0000-000000000000",
      });
      // Remove generic lead fields
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    } else if (auto.trigger_event === "content.production_scheduled") {
      Object.assign(testPayload, {
        piece_id: "00000000-0000-0000-0000-000000000000",
        title: "Por que seu cargo em portugues te elimina antes da entrevista",
        format: "long_video",
        status: "approved",
        production_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        old_production_date: null,
        action: "created",
        link: "https://hub.euanapratica.com/admin/content-pipeline?piece=00000000-0000-0000-0000-000000000000",
      });
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    } else if (auto.trigger_event === "content.publish_scheduled") {
      Object.assign(testPayload, {
        piece_id: "00000000-0000-0000-0000-000000000000",
        title: "Por que seu cargo em portugues te elimina antes da entrevista",
        format: "long_video",
        status: "recorded",
        scheduled_for: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        old_scheduled_for: null,
        action: "created",
        link: "https://hub.euanapratica.com/admin/content-pipeline?piece=00000000-0000-0000-0000-000000000000",
      });
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    } else if (auto.trigger_event === "content.published" || auto.trigger_event === "content.*") {
      Object.assign(testPayload, {
        platform: "x",
        post_url: "https://x.com/euanapratica/status/1234567890",
        post_id: "1234567890",
        post_text: "87% dos profissionais qualificados estao estagnados e acham que estao crescendo...",
        piece_id: "00000000-0000-0000-0000-000000000000",
        piece_title: "5 Sinais de Que Sua Carreira Esta Estagnada",
        piece_format: "youtube",
        published_at: new Date().toISOString(),
        platforms: {
          linkedin: { status: "published", post_url: "https://www.linkedin.com/feed/update/urn:li:share:765432", post_id: "urn:li:share:765432", published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
          x: { status: "published", post_url: "https://x.com/euanapratica/status/1234567890", post_id: "1234567890", published_at: new Date().toISOString() },
          threads: { status: "scheduled", post_url: null, post_id: null, published_at: null },
        },
        post_links: [
          { platform: "linkedin", url: "https://www.linkedin.com/feed/update/urn:li:share:765432" },
          { platform: "x", url: "https://x.com/euanapratica/status/1234567890" },
        ],
        all_platforms_published: false,
      });
      // Remove generic lead fields
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    } else if (auto.trigger_event === "content.all_platforms_published") {
      Object.assign(testPayload, {
        piece_id: "00000000-0000-0000-0000-000000000000",
        piece_title: "5 Sinais de Que Sua Carreira Esta Estagnada",
        piece_format: "youtube",
        platforms: {
          linkedin: { status: "published", post_url: "https://www.linkedin.com/feed/update/urn:li:share:765432", post_id: "urn:li:share:765432", published_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
          x: { status: "published", post_url: "https://x.com/euanapratica/status/1234567890", post_id: "1234567890", published_at: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
          threads: { status: "published", post_url: "https://www.threads.net/@euanapratica/post/ABC123", post_id: "12345678901234567", published_at: new Date().toISOString() },
        },
        post_links: [
          { platform: "linkedin", url: "https://www.linkedin.com/feed/update/urn:li:share:765432" },
          { platform: "x", url: "https://x.com/euanapratica/status/1234567890" },
          { platform: "threads", url: "https://www.threads.net/@euanapratica/post/ABC123" },
        ],
        completed_at: new Date().toISOString(),
      });
      // Remove generic lead fields
      delete testPayload.lead_id;
      delete testPayload.lead_name;
      delete testPayload.lead_email;
      delete testPayload.lead_phone;
    }

    // Dispatch server-side (no CORS issues)
    const startTime = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), auto.timeout_ms || 10000);

    let status: string;
    let responseStatus: number | null = null;
    let errorMessage: string | null = null;

    try {
      const response = await fetch(auto.webhook_url, {
        method: auto.webhook_method || "POST",
        headers: {
          "Content-Type": "application/json",
          ...(auto.headers || {}),
        },
        body: JSON.stringify(testPayload),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      responseStatus = response.status;

      if (response.ok) {
        status = "success";
      } else {
        const body = await response.text().catch(() => "");
        status = "error";
        errorMessage = `HTTP ${response.status}: ${body.slice(0, 500)}`;
      }
    } catch (err) {
      clearTimeout(timeout);
      const isTimeout = err instanceof DOMException && err.name === "AbortError";
      status = isTimeout ? "timeout" : "error";
      errorMessage = err instanceof Error ? err.message : "Unknown error";
    }

    const durationMs = Date.now() - startTime;

    // Log result
    await supabase.from("n8n_webhook_logs").insert({
      automation_id: auto.id,
      automation_name: auto.name,
      trigger_event: testPayload.event as string,
      payload: testPayload,
      response_status: responseStatus,
      response_body: errorMessage,
      duration_ms: durationMs,
      status,
      error_message: errorMessage,
    });

    await supabase
      .from("n8n_automations")
      .update({ last_triggered_at: new Date().toISOString(), last_status: status })
      .eq("id", auto.id);

    return new Response(
      JSON.stringify({ status, response_status: responseStatus, duration_ms: durationMs, error: errorMessage }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
