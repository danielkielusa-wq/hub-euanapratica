-- Add 'mention' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'mention';

-- SECURITY DEFINER RPC so any authenticated user can create a mention notification
-- (the INSERT policy only allows admin/mentor, but students need to mention too)
CREATE OR REPLACE FUNCTION public.create_mention_notification(
  p_mentioned_user_id UUID,
  p_author_name TEXT,
  p_session_title TEXT,
  p_session_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Don't notify yourself
  IF p_mentioned_user_id = auth.uid() THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (
    user_id,
    session_id,
    type,
    title,
    message,
    icon,
    category,
    action_url,
    status,
    sent_at
  ) VALUES (
    p_mentioned_user_id,
    p_session_id,
    'mention',
    p_author_name || ' mencionou você',
    'Na discussão de "' || p_session_title || '"',
    'at-sign',
    'social',
    p_action_url,
    'sent',
    NOW()
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.create_mention_notification TO authenticated;
