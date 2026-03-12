/**
 * OAuth Callback — handles OAuth redirects from LinkedIn and X.
 * Exchanges authorization code for tokens and stores in social_accounts.
 *
 * Query params: ?platform=linkedin|x&code=...&state=...
 *
 * Does NOT require JWT (redirect from external OAuth provider).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "../_shared/apiConfigService.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getAdminSupabase() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}

async function getAppConfig(key: string): Promise<string> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from("app_configs")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value || "";
}

async function getOAuthCredentials(platform: "linkedin" | "x" | "threads") {
  const apiKey = platform === "linkedin" ? "linkedin_oauth" : platform === "x" ? "x_oauth" : "threads_oauth";
  const config = await getApiConfig(apiKey);
  return {
    clientId: config.credentials.client_id,
    clientSecret: config.credentials.client_secret,
    redirectUri: config.parameters?.redirect_uri || "",
  };
}

serve(async (req) => {
  const url = new URL(req.url);

  // Handle OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  try {
    const platform = url.searchParams.get("platform");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      const desc = url.searchParams.get("error_description") || error;
      return redirectWithError(desc);
    }

    if (!platform || !code) {
      return redirectWithError("Missing platform or code parameter");
    }

    if (platform !== "linkedin" && platform !== "x" && platform !== "threads") {
      return redirectWithError("Invalid platform");
    }

    // Validate state (CSRF protection)
    const supabase = getAdminSupabase();
    const stateKey = `oauth_state_${state}`;
    const { data: stateData } = await supabase
      .from("app_configs")
      .select("value")
      .eq("key", stateKey)
      .single();

    if (!stateData) {
      return redirectWithError("Invalid or expired state parameter");
    }

    // Clean up state
    await supabase.from("app_configs").delete().eq("key", stateKey);

    const statePayload = JSON.parse(stateData.value);
    if (statePayload.platform !== platform) {
      return redirectWithError("State platform mismatch");
    }

    // Exchange code for tokens
    let tokenData: Record<string, unknown>;
    let profile: { id: string; name: string };

    if (platform === "linkedin") {
      tokenData = await exchangeLinkedInCode(code);
      profile = await getLinkedInProfile(tokenData.access_token as string);
    } else if (platform === "threads") {
      tokenData = await exchangeThreadsCode(code);
      // Exchange short-lived token for long-lived token
      tokenData = await exchangeThreadsLongLivedToken(tokenData.access_token as string);
      profile = await getThreadsProfile(tokenData.access_token as string);
    } else {
      tokenData = await exchangeXCode(code, statePayload.code_verifier);
      profile = await getXProfile(tokenData.access_token as string);
    }

    // Deactivate existing accounts for this platform
    await supabase
      .from("social_accounts")
      .update({ is_active: false })
      .eq("platform", platform)
      .eq("is_active", true);

    // Insert new account
    await supabase.from("social_accounts").insert({
      platform,
      account_name: profile.name,
      account_id: profile.id,
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || null,
      token_expires_at: tokenData.expires_in
        ? new Date(Date.now() + (tokenData.expires_in as number) * 1000).toISOString()
        : null,
      scopes: tokenData.scope ? (tokenData.scope as string).split(" ") : [],
      is_active: true,
      connected_by: statePayload.user_id || null,
      metadata: { connected_at: new Date().toISOString() },
    });

    // Redirect back to admin UI
    const frontendUrl = statePayload.redirect_url || `${SUPABASE_URL.replace('.supabase.co', '.vercel.app')}/admin/content-factory`;
    return Response.redirect(`${frontendUrl}?connected=${platform}`, 302);
  } catch (err) {
    console.error("[oauth-callback] Error:", err);
    return redirectWithError((err as Error).message);
  }
});

function redirectWithError(error: string): Response {
  // In case of error, redirect with error param
  const frontendBase = Deno.env.get("FRONTEND_URL") || "";
  if (frontendBase) {
    return Response.redirect(`${frontendBase}/admin/content-factory?oauth_error=${encodeURIComponent(error)}`, 302);
  }
  return new Response(JSON.stringify({ error }), {
    status: 400,
    headers: { "Content-Type": "application/json" },
  });
}

// ── LinkedIn ────────────────────────────────────────────────────────────

async function exchangeLinkedInCode(code: string): Promise<Record<string, unknown>> {
  const { clientId, clientSecret, redirectUri } = await getOAuthCredentials("linkedin");

  const resp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri || `${SUPABASE_URL}/functions/v1/oauth-callback?platform=linkedin`,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`LinkedIn token exchange failed: ${err}`);
  }

  return resp.json();
}

async function getLinkedInProfile(accessToken: string): Promise<{ id: string; name: string }> {
  const resp = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) throw new Error("Failed to fetch LinkedIn profile");
  const data = await resp.json();

  return {
    id: data.sub,
    name: data.name || `${data.given_name || ""} ${data.family_name || ""}`.trim(),
  };
}

// ── X/Twitter ───────────────────────────────────────────────────────────

async function exchangeXCode(
  code: string,
  codeVerifier: string,
): Promise<Record<string, unknown>> {
  const { clientId, clientSecret, redirectUri } = await getOAuthCredentials("x");

  const resp = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri || `${SUPABASE_URL}/functions/v1/oauth-callback?platform=x`,
      code_verifier: codeVerifier,
      client_id: clientId,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`X token exchange failed: ${err}`);
  }

  return resp.json();
}

async function getXProfile(accessToken: string): Promise<{ id: string; name: string }> {
  const resp = await fetch("https://api.twitter.com/2/users/me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) throw new Error("Failed to fetch X profile");
  const data = await resp.json();

  return {
    id: data.data.id,
    name: data.data.username || data.data.name,
  };
}

// ── Threads ────────────────────────────────────────────────────────────

async function exchangeThreadsCode(code: string): Promise<Record<string, unknown>> {
  const { clientId, clientSecret, redirectUri } = await getOAuthCredentials("threads");

  const resp = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri || `${SUPABASE_URL}/functions/v1/oauth-callback?platform=threads`,
      code,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Threads token exchange failed: ${err}`);
  }

  return resp.json();
}

async function exchangeThreadsLongLivedToken(shortLivedToken: string): Promise<Record<string, unknown>> {
  const { clientSecret } = await getOAuthCredentials("threads");

  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: clientSecret,
    access_token: shortLivedToken,
  });

  const resp = await fetch(`https://graph.threads.net/access_token?${params}`);

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Threads long-lived token exchange failed: ${err}`);
  }

  return resp.json();
}

async function getThreadsProfile(accessToken: string): Promise<{ id: string; name: string }> {
  const resp = await fetch(
    `https://graph.threads.net/v1.0/me?fields=id,username,name&access_token=${accessToken}`,
  );

  if (!resp.ok) throw new Error("Failed to fetch Threads profile");
  const data = await resp.json();

  return {
    id: data.id,
    name: data.username || data.name || "threads_user",
  };
}
