-- Add unsubscribe link "Cancelar inscrição" to ALL email template footers.
-- The {{unsubscribeLink}} variable is auto-injected by emailTemplateService.ts at send time.
-- Safe to re-run: only updates templates that don't already have unsubscribeLink.

-- 1. Add {{unsubscribeLink}} to the variables array
UPDATE public.email_templates
SET variables = variables || '["{{unsubscribeLink}}"]'::jsonb
WHERE NOT (variables @> '"{{unsubscribeLink}}"'::jsonb);

-- 2. Inject "Cancelar inscrição" link into standard footer (non-campaign templates)
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<p style="color: #a1a1aa; font-size: 12px; margin: 0;">© 2026 EUA Na Prática. Todos os direitos reservados.</p>',
  '<p style="color: #a1a1aa; font-size: 12px; margin: 0 0 12px;">© 2026 EUA Na Prática. Todos os direitos reservados.</p>
              <p style="margin: 0;"><a href="{{unsubscribeLink}}" style="color: #94a3b8; font-size: 11px; text-decoration: underline;">Cancelar inscrição</a></p>'
)
WHERE body_html LIKE '%© 2026 EUA Na Prática. Todos os direitos reservados.%'
  AND body_html NOT LIKE '%unsubscribeLink%';

-- 3. Also handle the variant with margin: 0 0 8px (some templates use different spacing)
UPDATE public.email_templates
SET body_html = REPLACE(
  body_html,
  '<p style="color: #a1a1aa; font-size: 12px; margin: 0 0 8px;">© 2026 EUA Na Prática. Todos os direitos reservados.</p>',
  '<p style="color: #a1a1aa; font-size: 12px; margin: 0 0 12px;">© 2026 EUA Na Prática. Todos os direitos reservados.</p>
              <p style="margin: 0;"><a href="{{unsubscribeLink}}" style="color: #94a3b8; font-size: 11px; text-decoration: underline;">Cancelar inscrição</a></p>'
)
WHERE body_html LIKE '%© 2026 EUA Na Prática. Todos os direitos reservados.%'
  AND body_html NOT LIKE '%unsubscribeLink%';
