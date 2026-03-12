-- ============================================================================
-- New carousel template: Indigo Gradient (platform brand colors)
-- ============================================================================

INSERT INTO public.content_visual_templates (
  name, display_name, type, html_template, css, variables, colors, fonts, is_default, is_active
) VALUES (
  'indigo_gradient',
  'Indigo Gradient',
  'carousel',
  '<div class="slide slide-{{slideType}}">
  <div class="pattern"></div>
  <div class="glow"></div>
  <div class="top-bar">
    <div class="slide-number">{{slideNumber}}<span class="total">/{{totalSlides}}</span></div>
  </div>
  <div class="main">
    <div class="accent-line"></div>
    <div class="headline">{{headline}}</div>
    <div class="body">{{body}}</div>
    <div class="accent-text">{{accentText}}</div>
  </div>
  <div class="footer">
    <div class="brand">EUA NA PRATICA</div>
    <div class="handle">@eua_na_pratica</div>
  </div>
</div>',
  '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 72px 80px;
  display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(145deg, #1e1b4b 0%, #312e81 30%, #4338ca 65%, #6366f1 100%);
  font-family: "Inter", system-ui, sans-serif; position: relative; overflow: hidden;
}
.pattern {
  position: absolute; inset: 0; opacity: 0.04;
  background-image: radial-gradient(circle at 1px 1px, white 1px, transparent 0);
  background-size: 40px 40px;
}
.glow {
  position: absolute; bottom: -180px; left: -100px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 65%);
}
.top-bar { display: flex; justify-content: flex-end; z-index: 1; }
.slide-number { font-size: 16px; font-weight: 700; color: rgba(199,210,254,0.6); letter-spacing: 1px; }
.slide-number .total { color: rgba(199,210,254,0.3); }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px; z-index: 1; }
.accent-line { width: 48px; height: 4px; background: #a5b4fc; border-radius: 2px; }
.headline {
  font-size: 44px; font-weight: 900; color: #ffffff;
  line-height: 1.15; letter-spacing: -0.5px; max-width: 860px;
}
.body {
  font-size: 24px; font-weight: 400; color: #c7d2fe;
  line-height: 1.6; max-width: 800px; white-space: pre-line;
}
.accent-text {
  font-size: 20px; font-weight: 700; color: #a5b4fc;
  padding: 12px 20px; background: rgba(165,180,252,0.1);
  border-left: 3px solid #a5b4fc; border-radius: 0 8px 8px 0;
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(199,210,254,0.15); padding-top: 20px; z-index: 1;
}
.brand { font-size: 14px; font-weight: 800; color: #a5b4fc; letter-spacing: 3px; text-transform: uppercase; }
.handle { font-size: 14px; font-weight: 500; color: rgba(199,210,254,0.4); }
/* Cover variant */
.slide-cover .headline { font-size: 56px; text-align: center; max-width: 100%; }
.slide-cover .body { text-align: center; font-size: 26px; color: #c7d2fe; max-width: 100%; }
.slide-cover .accent-line { margin: 0 auto; width: 64px; background: #818cf8; }
.slide-cover .accent-text { display: none; }
.slide-cover .main { align-items: center; }
/* Data variant */
.slide-data .accent-text {
  font-size: 64px; font-weight: 900; color: #818cf8;
  background: none; border: none; padding: 0; line-height: 1;
}
.slide-data .headline { font-size: 36px; color: #c7d2fe; font-weight: 600; }
/* CTA variant */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 48px; text-align: center; max-width: 100%; }
.slide-cta .body {
  font-size: 22px; text-align: center; max-width: 100%;
  padding: 20px 40px; background: rgba(255,255,255,0.1);
  border-radius: 16px; color: #e0e7ff; font-weight: 600;
  backdrop-filter: blur(4px);
}
.slide-cta .accent-line { margin: 0 auto; }',
  '["headline", "body", "accentText", "footnote", "slideNumber", "totalSlides", "slideType"]'::jsonb,
  '{"bg": "#312e81", "text": "#ffffff", "accent": "#818cf8", "secondary": "#c7d2fe"}'::jsonb,
  '{"heading": "Inter", "body": "Inter"}'::jsonb,
  false,
  true
)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  html_template = EXCLUDED.html_template,
  css = EXCLUDED.css,
  variables = EXCLUDED.variables,
  colors = EXCLUDED.colors,
  fonts = EXCLUDED.fonts,
  is_active = EXCLUDED.is_active,
  updated_at = now();
