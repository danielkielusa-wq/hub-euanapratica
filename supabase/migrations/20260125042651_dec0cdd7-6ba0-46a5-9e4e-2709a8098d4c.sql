-- Create table for submission messages (conversation history between student and mentor)
CREATE TABLE public.submission_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Optional: track if message was read
    read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.submission_messages ENABLE ROW LEVEL SECURITY;

-- Students can view messages for their own submissions
CREATE POLICY "Students can view own submission messages"
ON public.submission_messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_messages.submission_id
        AND s.user_id = auth.uid()
    )
);

-- Mentors/Admins can view all submission messages
CREATE POLICY "Mentors can view all submission messages"
ON public.submission_messages
FOR SELECT
USING (is_admin_or_mentor(auth.uid()));

-- Students can insert messages for their own submissions
CREATE POLICY "Students can create messages for own submissions"
ON public.submission_messages
FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = submission_messages.submission_id
        AND s.user_id = auth.uid()
    )
);

-- Mentors can insert messages for any submission
CREATE POLICY "Mentors can create messages for submissions"
ON public.submission_messages
FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    is_admin_or_mentor(auth.uid())
);

-- Create index for faster queries
CREATE INDEX idx_submission_messages_submission_id ON public.submission_messages(submission_id);
CREATE INDEX idx_submission_messages_created_at ON public.submission_messages(created_at DESC);