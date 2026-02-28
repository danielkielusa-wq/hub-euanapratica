-- ============================================================
-- Add {{calendarSection}} placeholder to booking email templates
-- This variable is pre-rendered by the Edge Functions with:
--   - "Add to Google Calendar" button
--   - Note about .ics attachment for Outlook/Apple Calendar
-- The .ics file itself is sent as an email attachment (not in HTML)
-- ============================================================

-- booking_confirmation: insert {{calendarSection}} before closing </body>
UPDATE public.email_templates
SET
  body_html = REPLACE(body_html, '</body>', '{{calendarSection}}
</body>'),
  variables = variables || '["{{calendarSection}}"]'::JSONB
WHERE name = 'booking_confirmation'
  AND body_html NOT LIKE '%{{calendarSection}}%';

-- booking_rescheduled: insert {{calendarSection}} before closing </body>
UPDATE public.email_templates
SET
  body_html = REPLACE(body_html, '</body>', '{{calendarSection}}
</body>'),
  variables = variables || '["{{calendarSection}}"]'::JSONB
WHERE name = 'booking_rescheduled'
  AND body_html NOT LIKE '%{{calendarSection}}%';

-- booking_reminder: insert {{calendarSection}} before closing </body>
UPDATE public.email_templates
SET
  body_html = REPLACE(body_html, '</body>', '{{calendarSection}}
</body>'),
  variables = variables || '["{{calendarSection}}"]'::JSONB
WHERE name = 'booking_reminder'
  AND body_html NOT LIKE '%{{calendarSection}}%';

-- booking_reminder_1h: insert {{calendarSection}} before closing </body>
UPDATE public.email_templates
SET
  body_html = REPLACE(body_html, '</body>', '{{calendarSection}}
</body>'),
  variables = variables || '["{{calendarSection}}"]'::JSONB
WHERE name = 'booking_reminder_1h'
  AND body_html NOT LIKE '%{{calendarSection}}%';
