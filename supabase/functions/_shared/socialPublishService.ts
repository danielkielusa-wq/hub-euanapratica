/**
 * Social Publishing Service — LinkedIn & X publishing with token management.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getApiConfig } from "./apiConfigService.ts";

export interface SocialAccount {
  id: string;
  platform: "linkedin" | "x" | "threads";
  account_name: string | null;
  account_id: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[];
  is_active: boolean;
  metadata: Record<string, unknown>;
}

export interface PublishResult {
  postId: string;
  postUrl: string;
  threadIds?: string[];
  textOnly?: boolean;
}

// ── Token Management ────────────────────────────────────────────────────

function getAdminSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
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
  };
}

export async function refreshTokenIfNeeded(
  account: SocialAccount,
): Promise<SocialAccount> {
  if (!account.token_expires_at || !account.refresh_token) return account;

  const expiresAt = new Date(account.token_expires_at);
  const now = new Date();
  const fiveMinutes = 5 * 60 * 1000;

  if (expiresAt.getTime() - now.getTime() > fiveMinutes) return account;

  console.log(`[socialPublish] Refreshing ${account.platform} token...`);

  if (account.platform === "linkedin") {
    return refreshLinkedInToken(account);
  } else if (account.platform === "threads") {
    return refreshThreadsToken(account);
  } else {
    return refreshXToken(account);
  }
}

async function refreshLinkedInToken(account: SocialAccount): Promise<SocialAccount> {
  const { clientId, clientSecret } = await getOAuthCredentials("linkedin");

  const resp = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token!,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`LinkedIn token refresh failed: ${err}`);
  }

  const data = await resp.json();
  const updated = {
    ...account,
    access_token: data.access_token,
    refresh_token: data.refresh_token || account.refresh_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };

  // Persist updated tokens
  const supabase = getAdminSupabase();
  await supabase
    .from("social_accounts")
    .update({
      access_token: updated.access_token,
      refresh_token: updated.refresh_token,
      token_expires_at: updated.token_expires_at,
    })
    .eq("id", account.id);

  return updated;
}

async function refreshXToken(account: SocialAccount): Promise<SocialAccount> {
  const { clientId, clientSecret } = await getOAuthCredentials("x");

  const resp = await fetch("https://api.twitter.com/2/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: account.refresh_token!,
      client_id: clientId,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`X token refresh failed: ${err}`);
  }

  const data = await resp.json();
  const updated = {
    ...account,
    access_token: data.access_token,
    refresh_token: data.refresh_token || account.refresh_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };

  const supabase = getAdminSupabase();
  await supabase
    .from("social_accounts")
    .update({
      access_token: updated.access_token,
      refresh_token: updated.refresh_token,
      token_expires_at: updated.token_expires_at,
    })
    .eq("id", account.id);

  return updated;
}

async function refreshThreadsToken(account: SocialAccount): Promise<SocialAccount> {
  const { clientId, clientSecret } = await getOAuthCredentials("threads");

  const resp = await fetch("https://graph.threads.net/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "th_refresh_token",
      access_token: account.access_token,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Threads token refresh failed: ${err}`);
  }

  const data = await resp.json();
  const updated = {
    ...account,
    access_token: data.access_token,
    token_expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };

  const supabase = getAdminSupabase();
  await supabase
    .from("social_accounts")
    .update({
      access_token: updated.access_token,
      token_expires_at: updated.token_expires_at,
    })
    .eq("id", account.id);

  return updated;
}

// ── LinkedIn Publishing ─────────────────────────────────────────────────

async function uploadImageToLinkedIn(
  account: SocialAccount,
  imageUrl: string,
): Promise<string> {
  // 1. Initialize upload
  const initResp = await fetch(
    "https://api.linkedin.com/rest/images?action=initializeUpload",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        "Content-Type": "application/json",
        "LinkedIn-Version": "202601",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify({
        initializeUploadRequest: {
          owner: `urn:li:person:${account.account_id}`,
        },
      }),
    },
  );

  if (!initResp.ok) {
    const err = await initResp.text();
    throw new Error(`LinkedIn image init failed: ${err}`);
  }

  const initData = await initResp.json();
  const uploadUrl = initData.value.uploadUrl;
  const imageUrn = initData.value.image;

  // 2. Download image and upload to LinkedIn
  const imgResp = await fetch(imageUrl);
  const imgBlob = await imgResp.blob();

  const uploadResp = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
      "Content-Type": "application/octet-stream",
    },
    body: imgBlob,
  });

  if (!uploadResp.ok) {
    throw new Error(`LinkedIn image upload failed: ${uploadResp.status}`);
  }

  return imageUrn;
}

export async function publishToLinkedIn(
  account: SocialAccount,
  text: string,
  imageUrls: string[],
): Promise<PublishResult> {
  const refreshedAccount = await refreshTokenIfNeeded(account);

  // Upload images
  const imageUrns: string[] = [];
  for (const url of imageUrls) {
    const urn = await uploadImageToLinkedIn(refreshedAccount, url);
    imageUrns.push(urn);
  }

  // Build post body (versioned Posts API format)
  const postBody: Record<string, unknown> = {
    author: `urn:li:person:${refreshedAccount.account_id}`,
    lifecycleState: "PUBLISHED",
    visibility: "PUBLIC",
    commentary: text,
    distribution: {
      feedDistribution: "MAIN_FEED",
      targetEntities: [],
      thirdPartyDistributionChannels: [],
    },
    isReshareDisabledByAuthor: false,
  };

  if (imageUrns.length === 1) {
    // Single image uses media content
    postBody.content = {
      media: {
        id: imageUrns[0],
        altText: "",
      },
    };
  } else if (imageUrns.length > 1) {
    // Multiple images use multiImage content (min 2, max 20)
    postBody.content = {
      multiImage: {
        images: imageUrns.slice(0, 20).map((urn) => ({
          id: urn,
          altText: "",
        })),
      },
    };
  }

  const resp = await fetch("https://api.linkedin.com/rest/posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshedAccount.access_token}`,
      "Content-Type": "application/json",
      "LinkedIn-Version": "202601",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(postBody),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`LinkedIn post failed (${resp.status}): ${err}`);
  }

  // LinkedIn returns post ID in x-restli-id header
  const postId = resp.headers.get("x-restli-id") || "";
  const postUrl = `https://www.linkedin.com/feed/update/${postId}`;

  return { postId, postUrl };
}

// ── X/Twitter Publishing ────────────────────────────────────────────────

async function uploadImageToX(
  account: SocialAccount,
  imageUrl: string,
): Promise<string> {
  // Download image
  const imgResp = await fetch(imageUrl);
  const imgBlob = await imgResp.blob();

  // Use multipart/form-data with binary (not base64) for OAuth 2.0 compatibility
  const formData = new FormData();
  formData.append("media", imgBlob, "image.png");
  formData.append("media_category", "tweet_image");

  const resp = await fetch("https://upload.twitter.com/1.1/media/upload.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${account.access_token}`,
    },
    body: formData,
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("[uploadImageToX] Failed:", resp.status, err);
    throw new Error(`X media upload failed (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  return data.media_id_string;
}

export async function publishToX(
  account: SocialAccount,
  text: string,
  imageUrls: string[],
): Promise<PublishResult> {
  const refreshedAccount = await refreshTokenIfNeeded(account);

  // Upload only the first image (cover slide) to save X API credits
  let mediaId: string | undefined;
  if (imageUrls.length > 0) {
    try {
      mediaId = await uploadImageToX(refreshedAccount, imageUrls[0]);
    } catch (err) {
      console.warn("[publishToX] Image upload failed, posting text-only:", (err as Error).message);
    }
  }

  // Create tweet
  const tweetBody: Record<string, unknown> = { text };
  if (mediaId) {
    tweetBody.media = { media_ids: [mediaId] };
  }

  const resp = await fetch("https://api.twitter.com/2/tweets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${refreshedAccount.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(tweetBody),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`X tweet failed (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  const tweetId = data.data.id;

  const postUrl = `https://x.com/${refreshedAccount.account_name || "i"}/status/${tweetId}`;
  return { postId: tweetId, postUrl };
}

// ── Threads Publishing ─────────────────────────────────────────────────

async function createThreadsMediaContainer(
  account: SocialAccount,
  params: Record<string, string>,
): Promise<string> {
  const url = `https://graph.threads.net/v1.0/${account.account_id}/threads`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      access_token: account.access_token,
      ...params,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Threads container creation failed (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  return data.id;
}

async function publishThreadsContainer(
  account: SocialAccount,
  containerId: string,
): Promise<string> {
  const url = `https://graph.threads.net/v1.0/${account.account_id}/threads_publish`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      access_token: account.access_token,
      creation_id: containerId,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Threads publish failed (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  return data.id;
}

async function waitForThreadsContainer(
  account: SocialAccount,
  containerId: string,
  maxWaitMs = 30000,
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const resp = await fetch(
      `https://graph.threads.net/v1.0/${containerId}?fields=status&access_token=${account.access_token}`,
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data.status === "FINISHED") return;
      if (data.status === "ERROR") throw new Error("Threads media container processing failed");
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Threads media container processing timeout");
}

export async function publishToThreads(
  account: SocialAccount,
  text: string,
  imageUrls: string[],
): Promise<PublishResult> {
  const refreshedAccount = await refreshTokenIfNeeded(account);

  let containerId: string;

  if (imageUrls.length === 0) {
    // Text-only post
    containerId = await createThreadsMediaContainer(refreshedAccount, {
      media_type: "TEXT",
      text,
    });
  } else if (imageUrls.length === 1) {
    // Single image post
    containerId = await createThreadsMediaContainer(refreshedAccount, {
      media_type: "IMAGE",
      image_url: imageUrls[0],
      text,
    });
    await waitForThreadsContainer(refreshedAccount, containerId);
  } else {
    // Carousel post (2-20 images)
    const childIds: string[] = [];
    for (const url of imageUrls.slice(0, 20)) {
      const childId = await createThreadsMediaContainer(refreshedAccount, {
        media_type: "IMAGE",
        image_url: url,
        is_carousel_item: "true",
      });
      childIds.push(childId);
    }

    // Wait for all children to finish processing
    for (const childId of childIds) {
      await waitForThreadsContainer(refreshedAccount, childId);
    }

    // Create carousel container
    containerId = await createThreadsMediaContainer(refreshedAccount, {
      media_type: "CAROUSEL",
      children: childIds.join(","),
      text,
    });
    await waitForThreadsContainer(refreshedAccount, containerId);
  }

  // Publish the container
  const postId = await publishThreadsContainer(refreshedAccount, containerId);
  const postUrl = `https://www.threads.net/@${refreshedAccount.account_name || "user"}/post/${postId}`;

  return { postId, postUrl };
}
