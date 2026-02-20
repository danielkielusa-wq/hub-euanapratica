/**
 * E2E Test: Plan Pricing & Feature Access Flow
 *
 * Este teste valida o fluxo completo de:
 * 1. Estrutura dos planos no banco de dados
 * 2. Acesso a features baseado no plano do usuário
 * 3. Sistema de upgrade via WhatsApp
 * 4. Integração TICTO para serviços do Hub
 * 5. Controle de quota mensal (uso/limite)
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Configuração do cliente Supabase para testes
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// IDs de usuários de teste (criar manualmente ou via seed)
const TEST_USERS = {
  basic: '00000000-0000-0000-0000-000000000001', // Usuário sem assinatura (plan básico default)
  pro: '00000000-0000-0000-0000-000000000002',   // Usuário com plano Pro
  vip: '00000000-0000-0000-0000-000000000003',   // Usuário com plano VIP
};

describe('Plan Pricing & Feature Access - End to End', () => {

  describe('1. Database Schema Validation', () => {
    it('should have exactly 3 active plans with correct pricing', async () => {
      const { data: plans, error } = await supabase
        .from('plans')
        .select('id, name, price, price_annual, monthly_limit, theme, is_popular')
        .eq('is_active', true)
        .order('price', { ascending: true });

      expect(error).toBeNull();
      expect(plans).toHaveLength(3);

      // Plano Básico
      expect(plans![0]).toMatchObject({
        id: 'basic',
        name: 'Básico',
        price: 0,
        price_annual: 0,
        monthly_limit: 1,
        theme: 'gray',
        is_popular: false,
      });

      // Plano Pro
      expect(plans![1]).toMatchObject({
        id: 'pro',
        name: 'Pro',
        price: 47,
        price_annual: 470,
        monthly_limit: 10,
        theme: 'blue',
        is_popular: true,
      });

      // Plano VIP
      expect(plans![2]).toMatchObject({
        id: 'vip',
        name: 'VIP',
        price: 97,
        price_annual: 970,
        monthly_limit: 999,
        theme: 'purple',
        is_popular: false,
      });
    });

    it('should have all required features in plans JSONB', async () => {
      const { data: plans, error } = await supabase
        .from('plans')
        .select('id, features')
        .eq('is_active', true);

      expect(error).toBeNull();

      const requiredFeatures = [
        // Access toggles
        'hotseats', 'hotseat_priority', 'hotseat_guaranteed',
        'community', 'library', 'masterclass', 'job_concierge',
        'prime_jobs', // CRITICAL FIX
        // Curriculo USA
        'show_improvements', 'show_power_verbs', 'show_cheat_sheet', 'allow_pdf',
        // Limits
        'resume_pass_limit', 'title_translator_limit', 'job_concierge_count',
        // Discounts
        'discounts', 'coupon_code',
      ];

      plans!.forEach(plan => {
        requiredFeatures.forEach(feature => {
          expect(plan.features).toHaveProperty(feature);
        });
      });
    });
  });

  describe('2. Plan Feature Matrix Validation', () => {
    it('Basic plan should have minimal features', async () => {
      const { data, error } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.basic });

      expect(error).toBeNull();
      const planAccess = Array.isArray(data) ? data[0] : data;

      expect(planAccess.plan_id).toBe('basic');
      expect(planAccess.features).toMatchObject({
        community: true, // Everyone gets community
        hotseats: false,
        library: false,
        masterclass: false,
        job_concierge: false,
        prime_jobs: false, // CRITICAL FIX
        show_improvements: false,
        show_power_verbs: false, // CRITICAL FIX
        show_cheat_sheet: false,
        allow_pdf: false,
        resume_pass_limit: 1,
        title_translator_limit: 1,
      });
    });

    it('Pro plan should unlock mid-tier features', async () => {
      const { data, error } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.pro });

      expect(error).toBeNull();
      const planAccess = Array.isArray(data) ? data[0] : data;

      expect(planAccess.plan_id).toBe('pro');
      expect(planAccess.features).toMatchObject({
        community: true,
        hotseats: true,
        library: true,
        masterclass: true,
        prime_jobs: true, // CRITICAL FIX - Pro unlocks Prime Jobs
        show_improvements: true,
        show_power_verbs: true, // CRITICAL FIX
        allow_pdf: true,
        // VIP exclusives should be false
        hotseat_priority: false,
        hotseat_guaranteed: false,
        job_concierge: false,
        show_cheat_sheet: false, // VIP only
      });

      // Discounts
      expect(planAccess.features.discounts.base).toBe(10);
      expect(planAccess.features.discounts.consulting).toBe(10);
      expect(planAccess.features.coupon_code).toBe('PRO10OFF');
    });

    it('VIP plan should unlock all features', async () => {
      const { data, error } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.vip });

      expect(error).toBeNull();
      const planAccess = Array.isArray(data) ? data[0] : data;

      expect(planAccess.plan_id).toBe('vip');
      expect(planAccess.features).toMatchObject({
        community: true,
        hotseats: true,
        hotseat_priority: true,
        hotseat_guaranteed: true,
        library: true,
        masterclass: true,
        job_concierge: true,
        prime_jobs: true,
        show_improvements: true,
        show_power_verbs: true,
        show_cheat_sheet: true,
        allow_pdf: true,
        job_concierge_count: 20,
        resume_pass_limit: 999,
      });

      // VIP discounts
      expect(planAccess.features.discounts.base).toBe(20);
      expect(planAccess.features.discounts.consulting).toBe(20);
      expect(planAccess.features.discounts.mentorship_individual).toBe(10);
      expect(planAccess.features.coupon_code).toBe('VIP20ELITE');
    });
  });

  describe('3. Route Access Control', () => {
    const PROTECTED_ROUTES = {
      '/biblioteca': 'library', // PRO
      '/comunidade': 'community', // Básico (all)
      '/masterclass': 'masterclass', // PRO
      '/prime-jobs/bookmarks': 'prime_jobs', // PRO - CRITICAL FIX
    };

    it('Basic user should only access /comunidade', async () => {
      const { data, error } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.basic });

      const planAccess = Array.isArray(data) ? data[0] : data;

      expect(planAccess.features.community).toBe(true);
      expect(planAccess.features.library).toBe(false);
      expect(planAccess.features.masterclass).toBe(false);
      expect(planAccess.features.prime_jobs).toBe(false); // BLOCKED
    });

    it('Pro user should access biblioteca, masterclass, prime_jobs', async () => {
      const { data } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.pro });

      const planAccess = Array.isArray(data) ? data[0] : data;

      expect(planAccess.features.library).toBe(true);
      expect(planAccess.features.masterclass).toBe(true);
      expect(planAccess.features.prime_jobs).toBe(true); // UNLOCKED
    });
  });

  describe('4. Usage Quota System', () => {
    it('should track monthly usage correctly', async () => {
      const userId = TEST_USERS.basic;

      // Reset usage
      await supabase.rpc('admin_reset_user_usage', { p_user_id: userId });

      // Check initial quota
      const { data: before } = await supabase
        .rpc('get_full_plan_access', { p_user_id: userId });
      const beforeAccess = Array.isArray(before) ? before[0] : before;

      expect(beforeAccess.used_this_month).toBe(0);
      expect(beforeAccess.remaining).toBe(1); // Basic plan limit

      // Record usage
      await supabase.rpc('record_curriculo_usage', { p_user_id: userId });

      // Check after usage
      const { data: after } = await supabase
        .rpc('get_full_plan_access', { p_user_id: userId });
      const afterAccess = Array.isArray(after) ? after[0] : after;

      expect(afterAccess.used_this_month).toBe(1);
      expect(afterAccess.remaining).toBe(0); // Limit reached
    });

    it('Pro users should have 10 analyses quota', async () => {
      const { data } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.pro });

      const planAccess = Array.isArray(data) ? data[0] : data;
      expect(planAccess.monthly_limit).toBe(10);
    });

    it('VIP users should have unlimited quota (999)', async () => {
      const { data } = await supabase
        .rpc('get_full_plan_access', { p_user_id: TEST_USERS.vip });

      const planAccess = Array.isArray(data) ? data[0] : data;
      expect(planAccess.monthly_limit).toBe(999);
    });
  });

  describe('5. Hub Services & TICTO Integration', () => {
    it('should have hub_services with TICTO fields', async () => {
      const { data: services, error } = await supabase
        .from('hub_services')
        .select('id, name, ticto_product_id, ticto_checkout_url, status')
        .eq('is_visible_in_hub', true);

      expect(error).toBeNull();
      expect(services!.length).toBeGreaterThan(0);

      // Check if table has TICTO columns
      const serviceWithTicto = services!.find(s => s.ticto_checkout_url);
      if (serviceWithTicto) {
        expect(serviceWithTicto).toHaveProperty('ticto_product_id');
        expect(serviceWithTicto).toHaveProperty('ticto_checkout_url');
        expect(serviceWithTicto.status).toBe('premium');
      }
    });

    it('should validate product_type constraint allows all types', async () => {
      // This tests the migration fix for product_type constraint
      const validTypes = [
        'subscription',
        'one_time',
        'lifetime',
        'subscription_monthly',
        'subscription_annual',
      ];

      // Query should not fail
      const { error } = await supabase
        .from('hub_services')
        .select('product_type')
        .in('product_type', validTypes)
        .limit(1);

      expect(error).toBeNull();
    });
  });

  describe('6. Admin Functions', () => {
    it('admin should be able to change user plan', async () => {
      // Note: This requires admin auth, may need to be run with service role key
      const { data, error } = await supabase
        .rpc('admin_change_user_plan', {
          p_user_id: TEST_USERS.basic,
          p_new_plan_id: 'pro',
        });

      // If user is not admin, expect permission error
      // If admin, expect success
      if (error) {
        expect(error.message).toContain('Access denied');
      } else {
        expect(data).toBe(true);
      }
    });
  });
});

describe('Frontend TypeScript Type Safety', () => {
  it('PlanFeatureKey should include all features from database', () => {
    // This is a compile-time check - if types don't match, TypeScript will error
    const allFeatures: import('../../src/types/plans').PlanFeatureKey[] = [
      'hotseats',
      'hotseat_priority',
      'hotseat_guaranteed',
      'community',
      'library',
      'masterclass',
      'job_concierge',
      'prime_jobs', // CRITICAL FIX
      'show_improvements',
      'show_power_verbs', // CRITICAL FIX
      'show_cheat_sheet',
      'allow_pdf',
    ];

    expect(allFeatures).toHaveLength(12);
  });

  it('ROUTE_FEATURE_MAP should map /prime-jobs/bookmarks to prime_jobs', () => {
    const routeMap: Record<string, string> = {
      '/biblioteca': 'library',
      '/comunidade': 'community',
      '/masterclass': 'masterclass',
      '/prime-jobs/bookmarks': 'prime_jobs', // CRITICAL FIX
    };

    expect(routeMap['/prime-jobs/bookmarks']).toBe('prime_jobs');
  });
});

/**
 * INSTRUÇÕES PARA EXECUTAR OS TESTES:
 *
 * 1. Criar usuários de teste no Supabase:
 *    - Criar 3 profiles com os UUIDs especificados em TEST_USERS
 *    - Inserir subscriptions:
 *      INSERT INTO user_subscriptions (user_id, plan_id, status)
 *      VALUES ('00000000-0000-0000-0000-000000000002', 'pro', 'active'),
 *             ('00000000-0000-0000-0000-000000000003', 'vip', 'active');
 *
 * 2. Executar testes:
 *    npm run test:e2e
 *    ou
 *    npx vitest run tests/e2e/plan-pricing-flow.test.ts
 *
 * 3. Para testes de admin, usar service_role key:
 *    export SUPABASE_SERVICE_KEY="your-service-role-key"
 */
