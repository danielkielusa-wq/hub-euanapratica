-- Add unsubscribe link to ALL email template footers that don't have one yet.
-- Uses exact REPLACE on the common footer copyright line.
-- The {{unsubscribeLink}} variable is auto-injected by emailTemplateService.ts at send time.

-- Add {{unsubscribeLink}} to the variables array of all templates that don't have it
UPDATE public.email_templates
SET variables = variables || '["{{unsubscribeLink}}"]'::jsonb
WHERE NOT (variables @> '"{{unsubscribeLink}}"'::jsonb);

-- Pattern: the standard footer copyright paragraph used in non-campaign templates
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática. Todos os direitos reservados.</p>',
  '<p style="color: #a1a1aa; font-size: 12px; margin: 0 0 12px;">© 2026 EUA Na Prática. Todos os direitos reservados.</p>
              <p style="margin: 0;"><a href="{{unsubscribeLink}}" style="color: #94a3b8; font-size: 11px; text-decoration: underline;">Cancelar inscrição</a></p>'
)
WHERE body_html LIKE '%© 2026 EUA Na Prática. Todos os direitos reservados.%'
  AND body_html NOT LIKE '%unsubscribeLink%';
