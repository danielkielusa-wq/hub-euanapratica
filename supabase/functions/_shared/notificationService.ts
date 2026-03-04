/**
 * In-App Notification Service
 *
 * Creates notification records in the `notifications` table.
 * Respects admin-configured type toggles (`notification_type_configs`)
 * and per-user preferences (`user_notification_preferences`).
 *
 * Fire-and-forget: never throws, never blocks the caller.
 *
 * USO: Edge Functions — call createNotification() after relevant events.
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ────────────────────────────────────────────────────────────

interface CreateNotificationOptions {
  userId: string;
  type: string;
  title: string;
  message?: string;
  actionUrl?: string;
  icon?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

interface BulkNotificationOptions {
  userIds: string[];
  type: string;
  title: string;
  message?: string;
  actionUrl?: string;
  icon?: string;
  category?: string;
  metadata?: Record<string, unknown>;
}

interface TypeConfig {
  type_key: string;
  in_app_enabled: boolean;
}

interface UserPref {
  in_app_enabled: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────

function getServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

/**
 * Check if a notification type is globally enabled by admin.
 * Returns true if enabled or if config not found (default: enabled).
 */
async function isTypeEnabled(
  sb: SupabaseClient,
  typeKey: string
): Promise<boolean> {
  try {
    const { data } = await sb
      .from("notification_type_configs")
      .select("type_key, in_app_enabled")
      .eq("type_key", typeKey)
      .single();

    if (!data) return true; // No config = default enabled
    return (data as TypeConfig).in_app_enabled;
  } catch {
    return true; // On error, default to enabled
  }
}

/**
 * Check if a specific user has opted out of this notification type.
 * Returns true if the user wants to receive (default: true).
 */
async function isUserOptedIn(
  sb: SupabaseClient,
  userId: string,
  typeKey: string
): Promise<boolean> {
  try {
    const { data } = await sb
      .from("user_notification_preferences")
      .select("in_app_enabled")
      .eq("user_id", userId)
      .eq("type_key", typeKey)
      .single();

    if (!data) return true; // No preference = default opted in
    return (data as UserPref).in_app_enabled;
  } catch {
    return true; // On error, default to opted in
  }
}

/**
 * Get icon and category from type config if not explicitly provided.
 */
async function getTypeDefaults(
  sb: SupabaseClient,
  typeKey: string
): Promise<{ icon: string; category: string }> {
  try {
    const { data } = await sb
      .from("notification_type_configs")
      .select("icon, category")
      .eq("type_key", typeKey)
      .single();

    return {
      icon: (data as any)?.icon || "bell",
      category: (data as any)?.category || "system",
    };
  } catch {
    return { icon: "bell", category: "system" };
  }
}

// ── Main Functions ──────────────────────────────────────────────────

/**
 * Create a single in-app notification for one user.
 *
 * NEVER throws — safe for fire-and-forget usage.
 *
 * @example
 * await createNotification({
 *   userId: "abc-123",
 *   type: "post_commented",
 *   title: "Novo comentario no seu post",
 *   message: "João comentou: 'Otimo conteudo!'",
 *   actionUrl: "/comunidade/posts/xyz",
 *   category: "social",
 * });
 */
export async function createNotification(
  options: CreateNotificationOptions,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    const sb = supabase ?? getServiceClient();

    // Check if type is globally enabled
    if (!(await isTypeEnabled(sb, options.type))) {
      return;
    }

    // Check user preference
    if (!(await isUserOptedIn(sb, options.userId, options.type))) {
      return;
    }

    // Get defaults from config if not provided
    const defaults = await getTypeDefaults(sb, options.type);

    const { error } = await sb.from("notifications").insert({
      user_id: options.userId,
      type: options.type,
      title: options.title,
      message: options.message || null,
      action_url: options.actionUrl || null,
      icon: options.icon || defaults.icon,
      category: options.category || defaults.category,
      metadata: options.metadata || {},
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    if (error) {
    } else {
    }
  } catch (err) {
  }
}

/**
 * Create notifications for multiple users at once.
 * Filters out users who opted out and skips if type is globally disabled.
 *
 * NEVER throws — safe for fire-and-forget usage.
 *
 * @example
 * await createBulkNotifications({
 *   userIds: ["user1", "user2", "user3"],
 *   type: "live_scheduled",
 *   title: "Nova live agendada: Como criar seu curriculo",
 *   actionUrl: "/lives/abc",
 * });
 */
export async function createBulkNotifications(
  options: BulkNotificationOptions,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    const sb = supabase ?? getServiceClient();

    // Check if type is globally enabled
    if (!(await isTypeEnabled(sb, options.type))) {
      return;
    }

    if (!options.userIds || options.userIds.length === 0) {
      return;
    }

    // Get users who opted out
    const { data: optedOut } = await sb
      .from("user_notification_preferences")
      .select("user_id")
      .eq("type_key", options.type)
      .eq("in_app_enabled", false)
      .in("user_id", options.userIds);

    const optedOutIds = new Set((optedOut || []).map((p: any) => p.user_id));
    const eligibleUserIds = options.userIds.filter((id) => !optedOutIds.has(id));

    if (eligibleUserIds.length === 0) {
      return;
    }

    // Get defaults from config
    const defaults = await getTypeDefaults(sb, options.type);

    // Build insert rows
    const rows = eligibleUserIds.map((userId) => ({
      user_id: userId,
      type: options.type,
      title: options.title,
      message: options.message || null,
      action_url: options.actionUrl || null,
      icon: options.icon || defaults.icon,
      category: options.category || defaults.category,
      metadata: options.metadata || {},
      status: "sent",
      sent_at: new Date().toISOString(),
    }));

    // Insert in batches of 500 to avoid payload limits
    const BATCH_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error } = await sb.from("notifications").insert(batch);

      if (error) {
      } else {
        inserted += batch.length;
      }
    }

  } catch (err) {
  }
}

/**
 * Notify ALL active users in the platform.
 * Queries profiles with status='active', then calls createBulkNotifications.
 *
 * Use for platform-wide announcements: product launches, new lives, etc.
 *
 * NEVER throws — safe for fire-and-forget usage.
 *
 * @example
 * await notifyAllActiveUsers({
 *   type: "product_launch",
 *   title: "Novo servico disponivel: Mentoria VIP",
 *   message: "Confira nosso novo servico de mentoria personalizada!",
 *   actionUrl: "/catalogo",
 * });
 */
export async function notifyAllActiveUsers(
  options: Omit<BulkNotificationOptions, "userIds">,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    const sb = supabase ?? getServiceClient();

    // Query all active user IDs
    const { data: users, error } = await sb
      .from("profiles")
      .select("id")
      .eq("status", "active");

    if (error) {
      return;
    }

    if (!users || users.length === 0) {
      return;
    }

    const userIds = users.map((u: any) => u.id);

    await createBulkNotifications({ ...options, userIds }, sb);
  } catch (err) {
  }
}
