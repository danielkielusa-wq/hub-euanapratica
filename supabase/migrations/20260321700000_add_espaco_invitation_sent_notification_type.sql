-- Add espaco_invitation_sent to the notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'espaco_invitation_sent';

-- Add type config for espaco_invitation_sent
INSERT INTO notification_type_configs (type_key, display_name, description, icon, category, in_app_enabled, email_enabled)
VALUES ('espaco_invitation_sent', 'Convite Enviado', 'Confirmacao de que um convite de espaco foi enviado', 'send', 'scheduling', true, false)
ON CONFLICT (type_key) DO NOTHING;
