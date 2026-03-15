-- Telegram Bot configuration in app_configs (replaces env vars)
INSERT INTO public.app_configs (key, value, description) VALUES
  ('telegram_bot_token', '', 'Token do bot Telegram (obtido via @BotFather)'),
  ('telegram_chat_id', '', 'Chat ID do Telegram para notificações (obtido via @userinfobot)'),
  ('telegram_notifications_enabled', 'true', 'Ativar/desativar notificações via Telegram')
ON CONFLICT (key) DO UPDATE SET
  description = EXCLUDED.description;
