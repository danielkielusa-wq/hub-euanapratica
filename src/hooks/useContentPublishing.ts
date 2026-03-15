/**
 * Hooks for social media publishing: accounts, publications, OAuth.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// ── Types ────────────────────────────────────────────────────────────────

export interface SocialAccount {
  id: string;
  platform: 'linkedin' | 'x' | 'threads';
  account_name: string | null;
  account_id: string | null;
  token_expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ContentPublication {
  id: string;
  piece_id: string;
  platform: 'linkedin' | 'x' | 'threads';
  social_account_id: string | null;
  post_text: string;
  media_asset_ids: string[];
  scheduled_at: string | null;
  published_at: string | null;
  platform_post_id: string | null;
  platform_post_url: string | null;
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled';
  error_message: string | null;
  retry_count: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Queries ──────────────────────────────────────────────────────────────

export function useSocialAccounts() {
  return useQuery<SocialAccount[]>({
    queryKey: ['social-accounts'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('social_accounts')
        .select('id, platform, account_name, account_id, token_expires_at, scopes, is_active, metadata, created_at, updated_at')
        .eq('is_active', true)
        .order('platform');
      if (error) throw error;
      return (data || []) as SocialAccount[];
    },
    staleTime: 60 * 1000,
  });
}

export function useContentPublications(pieceId?: string) {
  return useQuery<ContentPublication[]>({
    queryKey: ['content-publications', pieceId],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_publications')
        .select('*')
        .order('created_at', { ascending: false });
      if (pieceId) query = query.eq('piece_id', pieceId);
      const { data, error } = await query.limit(100);
      if (error) throw error;
      return (data || []) as ContentPublication[];
    },
    enabled: pieceId !== undefined,
  });
}

export function useAllPublications(filters?: { status?: string; platform?: string }) {
  return useQuery<ContentPublication[]>({
    queryKey: ['content-publications-all', filters],
    queryFn: async () => {
      let query = (supabase as any)
        .from('content_publications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.platform) query = query.eq('platform', filters.platform);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as ContentPublication[];
    },
  });
}

// ── Generate Social Post (LLM per-platform) ─────────────────────────────

export interface GeneratedSocialPost {
  content: string;
  hashtags: string[];
  engagement_tips: string | null;
  best_posting_time: string | null;
  alternative_hooks: string[];
}

export function useGenerateSocialPost() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ pieceId, platform }: { pieceId: string; platform: 'linkedin' | 'x' }) => {
      const { data, error } = await supabase.functions.invoke('generate-social-post', {
        body: { piece_id: pieceId, platform },
      });
      if (error) {
        let detail = error.message;
        try {
          const resp = (error as any).context;
          if (resp?.json) {
            const body = await Promise.race([
              resp.json(),
              new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
            ]);
            detail = (body as any)?.error || detail;
          }
        } catch { /* use original */ }
        throw new Error(detail);
      }
      if (data?.error) throw new Error(data.error);
      return data.post as GeneratedSocialPost;
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao gerar post', description: error.message, variant: 'destructive' });
    },
  });
}

// ── Mutations ────────────────────────────────────────────────────────────

export interface CreatePublicationInput {
  piece_id: string;
  platform: 'linkedin' | 'x' | 'threads';
  post_text: string;
  media_asset_ids?: string[];
  scheduled_at?: string | null;
  publish_now?: boolean;
}

export function useCreatePublication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreatePublicationInput) => {
      const { publish_now, ...fields } = input;

      // Prevent duplicate: check if there's already an active publication for this piece+platform
      const { data: existing } = await (supabase as any)
        .from('content_publications')
        .select('id, status')
        .eq('piece_id', input.piece_id)
        .eq('platform', input.platform)
        .in('status', ['scheduled', 'publishing', 'published'])
        .limit(1);

      if (existing?.length) {
        const s = existing[0].status;
        const label = s === 'published' ? 'já publicado' : s === 'publishing' ? 'sendo publicado agora' : 'já agendado';
        throw new Error(`Este conteúdo já está ${label} no ${input.platform === 'linkedin' ? 'LinkedIn' : input.platform === 'threads' ? 'Threads' : 'X'}`);
      }

      // Get active account for this platform
      const { data: accounts } = await (supabase as any)
        .from('social_accounts')
        .select('id')
        .eq('platform', input.platform)
        .eq('is_active', true)
        .limit(1);

      const accountId = accounts?.[0]?.id || null;

      const { data: pub, error } = await (supabase as any)
        .from('content_publications')
        .insert({
          ...fields,
          social_account_id: accountId,
          status: publish_now ? 'scheduled' : (fields.scheduled_at ? 'scheduled' : 'draft'),
          scheduled_at: publish_now ? new Date().toISOString() : fields.scheduled_at,
        })
        .select()
        .single();
      if (error) throw error;

      // If publish_now, call the edge function immediately
      if (publish_now && pub) {
        const { data, error: fnError } = await supabase.functions.invoke('publish-content', {
          body: { publication_id: pub.id },
        });
        if (fnError) {
          let detail = fnError.message;
          try {
            const resp = (fnError as any).context;
            if (resp?.json) {
              const body = await Promise.race([
                resp.json(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
              ]);
              detail = (body as any)?.error || detail;
            }
          } catch { /* use original */ }
          throw new Error(detail);
        }
        if (data?.error) throw new Error(data.error);
        return data;
      }

      return pub;
    },
    onSuccess: (data, input) => {
      queryClient.invalidateQueries({ queryKey: ['content-publications'] });
      queryClient.invalidateQueries({ queryKey: ['content-publications-all'] });
      const postUrl = data?.postUrl;
      const textOnly = data?.textOnly;
      toast({
        title: input.publish_now
          ? `Publicado no ${input.platform === 'linkedin' ? 'LinkedIn' : input.platform === 'threads' ? 'Threads' : 'X'}${textOnly ? ' (sem imagens)' : ''}`
          : input.scheduled_at
          ? 'Publicacao agendada'
          : 'Rascunho salvo',
        description: textOnly
          ? 'Upload de imagens falhou (plano X API Free nao suporta). Publicado apenas texto.'
          : postUrl
          ? 'Link copiado para clipboard'
          : undefined,
        variant: textOnly ? 'destructive' : undefined,
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao publicar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useCancelPublication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('content_publications')
        .update({ status: 'cancelled' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-publications'] });
      queryClient.invalidateQueries({ queryKey: ['content-publications-all'] });
      toast({ title: 'Publicacao cancelada' });
    },
  });
}

export function useRetryPublication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      // Reset to scheduled with scheduled_at = now
      await (supabase as any)
        .from('content_publications')
        .update({ status: 'scheduled', error_message: null, scheduled_at: new Date().toISOString() })
        .eq('id', id);

      // Call publish immediately
      const { data, error } = await supabase.functions.invoke('publish-content', {
        body: { publication_id: id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-publications'] });
      queryClient.invalidateQueries({ queryKey: ['content-publications-all'] });
      toast({ title: 'Publicacao reenviada' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao reenviar', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDisconnectAccount() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('social_accounts')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-accounts'] });
      toast({ title: 'Conta desconectada' });
    },
  });
}

// ── OAuth Initiation ────────────────────────────────────────────────────

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  return crypto.subtle.digest('SHA-256', encoder.encode(plain));
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const digest = await sha256(verifier);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function useInitOAuth() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (platform: 'linkedin' | 'x' | 'threads') => {
      // Generate state nonce
      const state = crypto.randomUUID();
      const codeVerifier = generateCodeVerifier();

      // Get client ID from api_configs
      const oauthKey = platform === 'linkedin' ? 'linkedin_oauth' : platform === 'x' ? 'x_oauth' : 'threads_oauth';
      const { data: apiConfig } = await (supabase as any)
        .from('api_configs')
        .select('credentials, parameters')
        .eq('api_key', oauthKey)
        .eq('is_active', true)
        .single();

      const clientId = apiConfig?.credentials?.client_id;
      if (!clientId) throw new Error(`${oauthKey} nao configurado em /admin/configuracoes-apis`);
      const configRedirectUri = apiConfig?.parameters?.redirect_uri || '';

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Store state in app_configs (temporary, cleaned up by oauth-callback)
      const statePayload = {
        platform,
        code_verifier: codeVerifier,
        user_id: user?.id,
        redirect_url: window.location.origin + '/admin/content-factory',
        created_at: new Date().toISOString(),
      };

      await (supabase as any)
        .from('app_configs')
        .upsert({
          key: `oauth_state_${state}`,
          value: JSON.stringify(statePayload),
          description: `OAuth state (temp, auto-cleanup)`,
        }, { onConflict: 'key' });

      // Build OAuth URL
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const redirectUri = configRedirectUri || `${supabaseUrl}/functions/v1/oauth-callback?platform=${platform}`;

      let authUrl: string;
      if (platform === 'linkedin') {
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          scope: 'openid profile w_member_social',
        });
        authUrl = `https://www.linkedin.com/oauth/v2/authorization?${params}`;
      } else if (platform === 'threads') {
        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          scope: 'threads_basic,threads_content_publish,threads_manage_replies',
          response_type: 'code',
        });
        authUrl = `https://threads.net/oauth/authorize?${params}`;
      } else {
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: clientId,
          redirect_uri: redirectUri,
          state,
          scope: 'tweet.write tweet.read users.read offline.access',
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        });
        authUrl = `https://twitter.com/i/oauth2/authorize?${params}`;
      }

      // Open in popup
      const width = 600;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      window.open(authUrl, 'oauth', `width=${width},height=${height},left=${left},top=${top}`);
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao iniciar OAuth', description: error.message, variant: 'destructive' });
    },
  });
}
