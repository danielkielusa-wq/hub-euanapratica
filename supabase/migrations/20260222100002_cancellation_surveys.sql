-- ============================================================================
-- Migration: Cancellation Surveys
-- Creates table for storing exit survey data when users cancel subscriptions
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_cancellation_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
  reason TEXT NOT NULL CHECK (reason IN (
    'too_expensive',
    'not_using',
    'found_alternative',
    'missing_features',
    'technical_issues',
    'temporary_pause',
    'other'
  )),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for analytics
CREATE INDEX idx_cancellation_surveys_user ON subscription_cancellation_surveys(user_id);
CREATE INDEX idx_cancellation_surveys_reason ON subscription_cancellation_surveys(reason);
CREATE INDEX idx_cancellation_surveys_created ON subscription_cancellation_surveys(created_at);

-- RLS
ALTER TABLE subscription_cancellation_surveys ENABLE ROW LEVEL SECURITY;

-- Users can insert their own surveys
CREATE POLICY "Users can insert own cancellation surveys"
  ON subscription_cancellation_surveys
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own surveys
CREATE POLICY "Users can read own cancellation surveys"
  ON subscription_cancellation_surveys
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all surveys
CREATE POLICY "Admins can read all cancellation surveys"
  ON subscription_cancellation_surveys
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
