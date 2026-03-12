/**
 * SlideRenderer — renders a single carousel slide from template + data.
 * Uses html-to-image to convert a hidden DOM element to PNG blob.
 */

import { useRef, useCallback, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';

// ── Logo base64 cache ─────────────────────────────────────────────────────
const _logoCache: Record<string, string> = {};

async function fetchLogoBase64(path: string): Promise<string> {
  if (_logoCache[path]) return _logoCache[path];
  const resp = await fetch(path);
  const blob = await resp.blob();
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      _logoCache[path] = reader.result as string;
      resolve(_logoCache[path]);
    };
    reader.readAsDataURL(blob);
  });
}

async function getLogos() {
  const [logoDarkSrc, logoWhiteSrc] = await Promise.all([
    fetchLogoBase64('/logo-enp.png'),
    fetchLogoBase64('/enp_white_transparent.png'),
  ]);
  return { logoDarkSrc, logoWhiteSrc };
}

function useLogos() {
  const [logos, setLogos] = useState<{ logoDarkSrc: string; logoWhiteSrc: string }>({
    logoDarkSrc: _logoCache['/logo-enp.png'] || '',
    logoWhiteSrc: _logoCache['/enp_white_transparent.png'] || '',
  });
  useEffect(() => {
    getLogos().then(setLogos);
  }, []);
  return logos;
}

export interface SlideData {
  headline: string;
  body: string;
  slideNumber: number;
  totalSlides: number;
  slideType?: 'cover' | 'content' | 'data' | 'cta';
  accentText?: string;
  footnote?: string;
}

export interface TemplateConfig {
  html_template: string;
  css: string;
  colors: Record<string, string>;
  fonts: Record<string, string>;
}

/** Replace {{var}} placeholders in template HTML */
function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

/** Render a single slide to PNG blob */
export async function renderSlideToBlob(
  template: TemplateConfig,
  slide: SlideData,
): Promise<Blob> {
  // Create an off-screen container
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  document.body.appendChild(container);

  try {
    // Inject CSS
    const styleEl = document.createElement('style');
    styleEl.textContent = template.css;
    container.appendChild(styleEl);

    // Get logos as base64 for reliable html-to-image capture
    const { logoDarkSrc, logoWhiteSrc } = await getLogos();

    // Interpolate HTML with slide data + colors
    const vars: Record<string, string | number> = {
      headline: slide.headline,
      body: slide.body,
      slideNumber: slide.slideNumber,
      totalSlides: slide.totalSlides,
      slideType: slide.slideType || 'content',
      accentText: slide.accentText || '',
      footnote: slide.footnote || '',
      logoDarkSrc,
      logoWhiteSrc,
      ...template.colors,
    };
    const html = interpolate(template.html_template, vars);

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    container.appendChild(wrapper);

    const slideEl = wrapper.querySelector('.slide') as HTMLElement || wrapper.firstElementChild as HTMLElement;
    if (!slideEl) throw new Error('Template must contain a .slide element');

    // Add slide_type class for CSS variant styling
    if (slide.slideType) {
      slideEl.classList.add(`slide-${slide.slideType}`);
    }

    // Wait for fonts to load
    await document.fonts.ready;
    // Small delay for rendering
    await new Promise((r) => setTimeout(r, 100));

    const dataUrl = await toPng(slideEl, {
      width: 1080,
      height: 1080,
      pixelRatio: 1,
      cacheBust: true,
    });

    const res = await fetch(dataUrl);
    return await res.blob();
  } finally {
    document.body.removeChild(container);
  }
}

/** Hidden component for previewing a slide in the DOM */
export function SlidePreviewFrame({
  template,
  slide,
  scale = 0.25,
}: {
  template: TemplateConfig;
  slide: SlideData;
  scale?: number;
}) {
  const { logoDarkSrc, logoWhiteSrc } = useLogos();

  const vars: Record<string, string | number> = {
    headline: slide.headline,
    body: slide.body,
    slideNumber: slide.slideNumber,
    totalSlides: slide.totalSlides,
    slideType: slide.slideType || 'content',
    accentText: slide.accentText || '',
    footnote: slide.footnote || '',
    logoDarkSrc,
    logoWhiteSrc,
    ...template.colors,
  };
  const html = interpolate(template.html_template, vars);

  return (
    <div
      style={{
        width: 1080 * scale,
        height: 1080 * scale,
        overflow: 'hidden',
        borderRadius: 8,
        border: '1px solid #e2e8f0',
      }}
    >
      <style>{template.css}</style>
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: 1080,
          height: 1080,
        }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
