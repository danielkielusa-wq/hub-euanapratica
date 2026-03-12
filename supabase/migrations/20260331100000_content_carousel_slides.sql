-- ============================================================================
-- Carousel Slides: optimized carousel content + professional templates
--
-- 1. Add carousel_slides JSONB column to content_pieces
-- 2. Replace templates with professional designs + slide_type variants
-- ============================================================================

-- ── 1. Add carousel_slides column ───────────────────────────────────────

ALTER TABLE public.content_pieces
  ADD COLUMN IF NOT EXISTS carousel_slides JSONB;

-- ── 2. Replace templates with professional versions ─────────────────────

-- Dark Professional
UPDATE public.content_visual_templates
SET
  html_template = '<div class="slide slide-{{slideType}}">
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
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 72px 80px;
  display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(160deg, #0c1222 0%, #162032 40%, #1a2740 100%);
  font-family: "Inter", system-ui, sans-serif; position: relative; overflow: hidden;
}
.slide::before {
  content: ""; position: absolute; top: -200px; right: -200px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%);
}
.top-bar { display: flex; justify-content: flex-end; }
.slide-number { font-size: 16px; font-weight: 700; color: rgba(249,115,22,0.5); letter-spacing: 1px; }
.slide-number .total { color: rgba(100,116,139,0.5); }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px; z-index: 1; }
.accent-line { width: 48px; height: 4px; background: #f97316; border-radius: 2px; }
.headline {
  font-size: 44px; font-weight: 900; color: #f1f5f9;
  line-height: 1.15; letter-spacing: -0.5px;
  max-width: 860px;
}
.body {
  font-size: 24px; font-weight: 400; color: #94a3b8;
  line-height: 1.6; max-width: 800px; white-space: pre-line;
}
.accent-text {
  font-size: 20px; font-weight: 700; color: #f97316;
  padding: 12px 20px; background: rgba(249,115,22,0.1);
  border-left: 3px solid #f97316; border-radius: 0 8px 8px 0;
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(100,116,139,0.2); padding-top: 20px;
}
.brand { font-size: 14px; font-weight: 800; color: #f97316; letter-spacing: 3px; text-transform: uppercase; }
.handle { font-size: 14px; font-weight: 500; color: #475569; }
/* Cover variant */
.slide-cover .headline { font-size: 56px; text-align: center; max-width: 100%; }
.slide-cover .body { text-align: center; font-size: 26px; color: #64748b; max-width: 100%; }
.slide-cover .accent-line { margin: 0 auto; width: 64px; }
.slide-cover .accent-text { display: none; }
.slide-cover .main { align-items: center; }
/* Data variant */
.slide-data .accent-text {
  font-size: 64px; font-weight: 900; color: #f97316;
  background: none; border: none; padding: 0; line-height: 1;
}
.slide-data .headline { font-size: 36px; color: #94a3b8; font-weight: 600; }
/* CTA variant */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 48px; text-align: center; max-width: 100%; }
.slide-cta .body {
  font-size: 22px; text-align: center; max-width: 100%;
  padding: 20px 40px; background: rgba(249,115,22,0.15);
  border-radius: 16px; color: #f97316; font-weight: 600;
}
.slide-cta .accent-line { margin: 0 auto; }',
  colors = '{"bg": "#0c1222", "text": "#f1f5f9", "accent": "#f97316", "secondary": "#475569"}'::jsonb,
  updated_at = now()
WHERE name = 'dark_professional';

-- Light Minimal
UPDATE public.content_visual_templates
SET
  html_template = '<div class="slide slide-{{slideType}}">
  <div class="side-stripe"></div>
  <div class="top-bar">
    <div class="slide-number">{{slideNumber}}<span class="total">/{{totalSlides}}</span></div>
  </div>
  <div class="main">
    <div class="headline">{{headline}}</div>
    <div class="divider"></div>
    <div class="body">{{body}}</div>
    <div class="accent-text">{{accentText}}</div>
  </div>
  <div class="footer">
    <div class="brand">EUA NA PRATICA</div>
    <div class="handle">@eua_na_pratica</div>
  </div>
  <div class="bottom-bar"></div>
</div>',
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 72px 80px 72px 96px;
  display: flex; flex-direction: column; justify-content: space-between;
  background: #fafbfc; font-family: "Inter", system-ui, sans-serif;
  position: relative; overflow: hidden;
}
.side-stripe {
  position: absolute; left: 0; top: 0; bottom: 0; width: 12px;
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%);
}
.bottom-bar {
  position: absolute; left: 12px; right: 0; bottom: 0; height: 6px;
  background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
}
.top-bar { display: flex; justify-content: flex-end; }
.slide-number { font-size: 15px; font-weight: 700; color: #2563eb; letter-spacing: 1px; }
.slide-number .total { color: #cbd5e1; }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 24px; }
.headline {
  font-size: 44px; font-weight: 900; color: #0f172a;
  line-height: 1.15; letter-spacing: -0.5px; max-width: 860px;
}
.divider { width: 48px; height: 3px; background: #2563eb; border-radius: 2px; }
.body {
  font-size: 24px; font-weight: 400; color: #475569;
  line-height: 1.65; max-width: 800px; white-space: pre-line;
}
.accent-text {
  display: inline-block; font-size: 18px; font-weight: 700; color: #2563eb;
  padding: 10px 20px; background: #eff6ff; border-radius: 10px;
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid #e2e8f0; padding-top: 20px;
}
.brand { font-size: 14px; font-weight: 800; color: #2563eb; letter-spacing: 3px; text-transform: uppercase; }
.handle { font-size: 14px; font-weight: 500; color: #94a3b8; }
/* Cover */
.slide-cover .headline { font-size: 52px; }
.slide-cover .body { font-size: 26px; color: #64748b; }
.slide-cover .main { gap: 28px; }
/* Data */
.slide-data .accent-text {
  font-size: 60px; font-weight: 900; color: #2563eb;
  background: #eff6ff; padding: 20px 32px; border-radius: 16px; line-height: 1;
}
.slide-data .headline { font-size: 32px; color: #64748b; font-weight: 600; }
/* CTA */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 44px; text-align: center; max-width: 100%; }
.slide-cta .divider { margin: 0 auto; }
.slide-cta .body {
  text-align: center; max-width: 100%; font-size: 22px;
  padding: 20px 40px; background: #eff6ff; border-radius: 16px;
  color: #2563eb; font-weight: 600;
}',
  colors = '{"bg": "#fafbfc", "text": "#0f172a", "accent": "#2563eb", "secondary": "#94a3b8"}'::jsonb,
  updated_at = now()
WHERE name = 'light_minimal';

-- Brand Gradient (replaces brand_orange)
UPDATE public.content_visual_templates
SET
  name = 'brand_gradient',
  display_name = 'Brand Gradient',
  html_template = '<div class="slide slide-{{slideType}}">
  <div class="bg-pattern"></div>
  <div class="top-bar">
    <div class="slide-number">{{slideNumber}}<span class="total">/{{totalSlides}}</span></div>
  </div>
  <div class="main">
    <div class="headline">{{headline}}</div>
    <div class="body">{{body}}</div>
    <div class="accent-text">{{accentText}}</div>
  </div>
  <div class="footer">
    <div class="brand">EUA NA PRATICA</div>
    <div class="handle">@eua_na_pratica</div>
  </div>
</div>',
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 72px 80px;
  display: flex; flex-direction: column; justify-content: space-between;
  background: linear-gradient(145deg, #c2410c 0%, #ea580c 30%, #f97316 60%, #fb923c 100%);
  font-family: "Inter", system-ui, sans-serif; position: relative; overflow: hidden;
}
.bg-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%);
}
.top-bar { display: flex; justify-content: flex-end; z-index: 1; }
.slide-number { font-size: 16px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 1px; }
.slide-number .total { color: rgba(255,255,255,0.25); }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px; z-index: 1; }
.headline {
  font-size: 46px; font-weight: 900; color: #ffffff;
  line-height: 1.15; letter-spacing: -0.5px; max-width: 860px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.body {
  font-size: 24px; font-weight: 500; color: rgba(255,255,255,0.9);
  line-height: 1.6; max-width: 800px; white-space: pre-line;
}
.accent-text {
  font-size: 20px; font-weight: 700; color: #ffffff;
  padding: 14px 24px; background: rgba(255,255,255,0.15);
  border-radius: 12px; backdrop-filter: blur(4px);
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; z-index: 1;
}
.brand { font-size: 14px; font-weight: 800; color: #ffffff; letter-spacing: 3px; text-transform: uppercase; }
.handle { font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.5); }
/* Cover */
.slide-cover .main { align-items: center; text-align: center; }
.slide-cover .headline { font-size: 58px; text-align: center; max-width: 100%; }
.slide-cover .body { text-align: center; font-size: 26px; max-width: 100%; }
/* Data */
.slide-data .accent-text {
  font-size: 64px; font-weight: 900; background: rgba(255,255,255,0.2);
  padding: 16px 32px; line-height: 1; border-radius: 16px;
}
.slide-data .headline { font-size: 32px; font-weight: 600; color: rgba(255,255,255,0.8); }
/* CTA */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 48px; text-align: center; max-width: 100%; }
.slide-cta .body {
  text-align: center; max-width: 100%; font-size: 24px;
  padding: 24px 48px; background: rgba(255,255,255,0.2);
  border-radius: 16px; backdrop-filter: blur(4px); font-weight: 700;
}',
  colors = '{"bg": "#ea580c", "text": "#ffffff", "accent": "#ffffff", "secondary": "rgba(255,255,255,0.5)"}'::jsonb,
  updated_at = now()
WHERE name = 'brand_orange';
