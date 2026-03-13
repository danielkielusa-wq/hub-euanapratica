-- ============================================================
-- Aurora AI Assistant — Persistent Conversations
-- ============================================================

-- Stores admin chat conversations with Aurora (messages as JSONB array)
CREATE TABLE public.assistant_conversations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Nova conversa',
    messages JSONB NOT NULL DEFAULT '[]'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.assistant_conversations IS 'Aurora AI assistant chat history — admin only';
COMMENT ON COLUMN public.assistant_conversations.messages IS 'Array of {role, content, tool_calls?, tool_results?, timestamp}';

CREATE INDEX idx_assistant_conversations_user_id ON public.assistant_conversations(user_id);
CREATE INDEX idx_assistant_conversations_updated ON public.assistant_conversations(updated_at DESC);

-- RLS: admin-only, scoped to own conversations
ALTER TABLE public.assistant_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read own conversations"
ON public.assistant_conversations FOR SELECT
USING (has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can insert own conversations"
ON public.assistant_conversations FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can update own conversations"
ON public.assistant_conversations FOR UPDATE
USING (has_role(auth.uid(), 'admin') AND user_id = auth.uid());

CREATE POLICY "Admins can delete own conversations"
ON public.assistant_conversations FOR DELETE
USING (has_role(auth.uid(), 'admin') AND user_id = auth.uid());

-- Trigger: auto-update updated_at
CREATE TRIGGER update_assistant_conversations_updated_at
BEFORE UPDATE ON public.assistant_conversations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Grants (required for both frontend RLS and Edge Function service_role access)
GRANT ALL ON public.assistant_conversations TO authenticated;
GRANT ALL ON public.assistant_conversations TO service_role;
