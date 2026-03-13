-- ════════════════════════════════════════════════════════════════════════
-- Content Calendar Timezone — configurable timezone for calendar invites
-- ════════════════════════════════════════════════════════════════════════

INSERT INTO app_configs (key, value, description)
VALUES (
  'content_calendar_timezone',
  'America/New_York',
  'IANA timezone used for displaying dates/times in content calendar invite emails (e.g. America/New_York = EST/EDT)'
)
ON CONFLICT (key) DO NOTHING;
