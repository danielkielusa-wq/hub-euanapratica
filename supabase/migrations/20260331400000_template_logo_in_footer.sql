-- ============================================================================
-- Add logo image to carousel template footers
--
-- Replaces text "EUA NA PRATICA" with <img> tag using {{logoSrc}} variable.
-- Dark templates use CSS filter to invert dark logo to white.
-- ============================================================================

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
    <div class="brand"><img src="{{logoSrc}}" class="brand-logo" alt="" /></div>
    <div class="handle">@eua_na_pratica</div>
  </div>
</div>',
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 64px 80px 56px;
  display: flex; flex-direction: column;
  background: linear-gradient(160deg, #0c1222 0%, #162032 40%, #1a2740 100%);
  font-family: "Inter", system-ui, sans-serif; position: relative; overflow: hidden;
}
.slide::before {
  content: ""; position: absolute; top: -200px; right: -200px;
  width: 500px; height: 500px; border-radius: 50%;
  background: radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%);
}
.top-bar { display: flex; justify-content: flex-end; margin-bottom: 24px; }
.slide-number { font-size: 18px; font-weight: 700; color: rgba(249,115,22,0.5); letter-spacing: 1px; }
.slide-number .total { color: rgba(100,116,139,0.5); }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 32px; z-index: 1; }
.accent-line { width: 56px; height: 5px; background: #f97316; border-radius: 3px; }
.headline {
  font-size: 56px; font-weight: 900; color: #f1f5f9;
  line-height: 1.12; letter-spacing: -1px;
}
.body {
  font-size: 30px; font-weight: 400; color: #94a3b8;
  line-height: 1.55; white-space: pre-line;
}
.accent-text {
  font-size: 24px; font-weight: 700; color: #f97316;
  padding: 16px 24px; background: rgba(249,115,22,0.1);
  border-left: 4px solid #f97316; border-radius: 0 10px 10px 0;
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(100,116,139,0.2); padding-top: 20px; margin-top: 24px;
}
.brand-logo { height: 28px; display: block; filter: brightness(0) invert(1); }
.handle { font-size: 16px; font-weight: 500; color: #475569; }
/* Cover variant */
.slide-cover .headline { font-size: 68px; text-align: center; }
.slide-cover .body { text-align: center; font-size: 32px; color: #64748b; }
.slide-cover .accent-line { margin: 0 auto; width: 72px; }
.slide-cover .accent-text { display: none; }
.slide-cover .main { align-items: center; }
/* Data variant */
.slide-data .accent-text {
  font-size: 80px; font-weight: 900; color: #f97316;
  background: none; border: none; padding: 0; line-height: 1;
}
.slide-data .headline { font-size: 40px; color: #94a3b8; font-weight: 600; }
/* CTA variant */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 60px; text-align: center; }
.slide-cta .body {
  font-size: 28px; text-align: center;
  padding: 24px 48px; background: rgba(249,115,22,0.15);
  border-radius: 16px; color: #f97316; font-weight: 600;
}
.slide-cta .accent-line { margin: 0 auto; }',
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
    <div class="brand"><img src="{{logoSrc}}" class="brand-logo" alt="" /></div>
    <div class="handle">@eua_na_pratica</div>
  </div>
  <div class="bottom-bar"></div>
</div>',
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 64px 80px 56px 96px;
  display: flex; flex-direction: column;
  background: #fafbfc; font-family: "Inter", system-ui, sans-serif;
  position: relative; overflow: hidden;
}
.side-stripe {
  position: absolute; left: 0; top: 0; bottom: 0; width: 14px;
  background: linear-gradient(180deg, #2563eb 0%, #3b82f6 100%);
}
.bottom-bar {
  position: absolute; left: 14px; right: 0; bottom: 0; height: 8px;
  background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
}
.top-bar { display: flex; justify-content: flex-end; margin-bottom: 24px; }
.slide-number { font-size: 18px; font-weight: 700; color: #2563eb; letter-spacing: 1px; }
.slide-number .total { color: #cbd5e1; }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 28px; }
.headline {
  font-size: 56px; font-weight: 900; color: #0f172a;
  line-height: 1.12; letter-spacing: -1px;
}
.divider { width: 56px; height: 4px; background: #2563eb; border-radius: 2px; }
.body {
  font-size: 30px; font-weight: 400; color: #475569;
  line-height: 1.55; white-space: pre-line;
}
.accent-text {
  display: inline-block; font-size: 24px; font-weight: 700; color: #2563eb;
  padding: 14px 24px; background: #eff6ff; border-radius: 12px;
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 24px;
}
.brand-logo { height: 28px; display: block; }
.handle { font-size: 16px; font-weight: 500; color: #94a3b8; }
/* Cover */
.slide-cover .headline { font-size: 64px; }
.slide-cover .body { font-size: 32px; color: #64748b; }
.slide-cover .main { gap: 32px; }
/* Data */
.slide-data .accent-text {
  font-size: 76px; font-weight: 900; color: #2563eb;
  background: #eff6ff; padding: 24px 40px; border-radius: 20px; line-height: 1;
}
.slide-data .headline { font-size: 38px; color: #64748b; font-weight: 600; }
/* CTA */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 56px; text-align: center; }
.slide-cta .divider { margin: 0 auto; }
.slide-cta .body {
  text-align: center; font-size: 28px;
  padding: 24px 48px; background: #eff6ff; border-radius: 16px;
  color: #2563eb; font-weight: 600;
}',
  updated_at = now()
WHERE name = 'light_minimal';

-- Brand Gradient
UPDATE public.content_visual_templates
SET
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
    <div class="brand"><img src="{{logoSrc}}" class="brand-logo" alt="" /></div>
    <div class="handle">@eua_na_pratica</div>
  </div>
</div>',
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 64px 80px 56px;
  display: flex; flex-direction: column;
  background: linear-gradient(145deg, #c2410c 0%, #ea580c 30%, #f97316 60%, #fb923c 100%);
  font-family: "Inter", system-ui, sans-serif; position: relative; overflow: hidden;
}
.bg-pattern {
  position: absolute; inset: 0;
  background-image: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 40%);
}
.top-bar { display: flex; justify-content: flex-end; z-index: 1; margin-bottom: 24px; }
.slide-number { font-size: 18px; font-weight: 700; color: rgba(255,255,255,0.4); letter-spacing: 1px; }
.slide-number .total { color: rgba(255,255,255,0.25); }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 32px; z-index: 1; }
.headline {
  font-size: 58px; font-weight: 900; color: #ffffff;
  line-height: 1.12; letter-spacing: -1px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.body {
  font-size: 30px; font-weight: 500; color: rgba(255,255,255,0.9);
  line-height: 1.55; white-space: pre-line;
}
.accent-text {
  font-size: 24px; font-weight: 700; color: #ffffff;
  padding: 18px 28px; background: rgba(255,255,255,0.15);
  border-radius: 14px; backdrop-filter: blur(4px);
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; z-index: 1; margin-top: 24px;
}
.brand-logo { height: 28px; display: block; filter: brightness(0) invert(1); }
.handle { font-size: 16px; font-weight: 500; color: rgba(255,255,255,0.5); }
/* Cover */
.slide-cover .main { align-items: center; text-align: center; }
.slide-cover .headline { font-size: 72px; text-align: center; }
.slide-cover .body { text-align: center; font-size: 32px; }
/* Data */
.slide-data .accent-text {
  font-size: 80px; font-weight: 900; background: rgba(255,255,255,0.2);
  padding: 20px 40px; line-height: 1; border-radius: 20px;
}
.slide-data .headline { font-size: 38px; font-weight: 600; color: rgba(255,255,255,0.8); }
/* CTA */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 60px; text-align: center; }
.slide-cta .body {
  text-align: center; font-size: 28px;
  padding: 28px 52px; background: rgba(255,255,255,0.2);
  border-radius: 16px; backdrop-filter: blur(4px); font-weight: 700;
}',
  updated_at = now()
WHERE name = 'brand_gradient';

-- Indigo Gradient
UPDATE public.content_visual_templates
SET
  html_template = '<div class="slide slide-{{slideType}}">
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
    <div class="brand"><img src="{{logoSrc}}" class="brand-logo" alt="" /></div>
    <div class="handle">@eua_na_pratica</div>
  </div>
</div>',
  css = '* { margin: 0; padding: 0; box-sizing: border-box; }
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap");
.slide {
  width: 1080px; height: 1080px; padding: 64px 80px 56px;
  display: flex; flex-direction: column;
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
.top-bar { display: flex; justify-content: flex-end; z-index: 1; margin-bottom: 24px; }
.slide-number { font-size: 18px; font-weight: 700; color: rgba(199,210,254,0.6); letter-spacing: 1px; }
.slide-number .total { color: rgba(199,210,254,0.3); }
.main { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 32px; z-index: 1; }
.accent-line { width: 56px; height: 5px; background: #a5b4fc; border-radius: 3px; }
.headline {
  font-size: 56px; font-weight: 900; color: #ffffff;
  line-height: 1.12; letter-spacing: -1px;
}
.body {
  font-size: 30px; font-weight: 400; color: #c7d2fe;
  line-height: 1.55; white-space: pre-line;
}
.accent-text {
  font-size: 24px; font-weight: 700; color: #a5b4fc;
  padding: 16px 24px; background: rgba(165,180,252,0.1);
  border-left: 4px solid #a5b4fc; border-radius: 0 10px 10px 0;
  max-width: fit-content;
}
.accent-text:empty { display: none; }
.footer {
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(199,210,254,0.15); padding-top: 20px; z-index: 1; margin-top: 24px;
}
.brand-logo { height: 28px; display: block; filter: brightness(0) invert(1); }
.handle { font-size: 16px; font-weight: 500; color: rgba(199,210,254,0.4); }
/* Cover variant */
.slide-cover .headline { font-size: 68px; text-align: center; }
.slide-cover .body { text-align: center; font-size: 32px; color: #c7d2fe; }
.slide-cover .accent-line { margin: 0 auto; width: 72px; background: #818cf8; }
.slide-cover .accent-text { display: none; }
.slide-cover .main { align-items: center; }
/* Data variant */
.slide-data .accent-text {
  font-size: 80px; font-weight: 900; color: #818cf8;
  background: none; border: none; padding: 0; line-height: 1;
}
.slide-data .headline { font-size: 40px; color: #c7d2fe; font-weight: 600; }
/* CTA variant */
.slide-cta .main { align-items: center; text-align: center; }
.slide-cta .headline { font-size: 60px; text-align: center; }
.slide-cta .body {
  font-size: 28px; text-align: center;
  padding: 24px 48px; background: rgba(255,255,255,0.1);
  border-radius: 16px; color: #e0e7ff; font-weight: 600;
  backdrop-filter: blur(4px);
}
.slide-cta .accent-line { margin: 0 auto; }',
  updated_at = now()
WHERE name = 'indigo_gradient';
