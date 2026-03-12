export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://seqgnxynrcylxsdzbloa.supabase.co';
const SITE_URL = 'https://hub.euanapratica.com';

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Em Breve',
  live: 'Ao Vivo',
  completed: 'Gravacao Disponivel',
};

const ACCESS_LABELS: Record<string, string> = {
  free: 'Gratuita',
  paid: 'Paga',
  subscribers: 'Assinantes',
  pro: 'Pro',
  vip: 'VIP',
};

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDateBR(isoDate: string): string {
  const d = new Date(isoDate);
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const day = d.getUTCDate();
  const month = months[d.getUTCMonth()];
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day} ${month} ${hours}:${mins} UTC`;
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug');

  if (!slug) {
    return Response.redirect(SITE_URL, 302);
  }

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    '';

  const canonicalUrl = `${SITE_URL}/live/${slug}`;

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_live_public_preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ p_slug: slug }),
    });

    if (!resp.ok) {
      return Response.redirect(canonicalUrl, 302);
    }

    const data = await resp.json();
    const live = Array.isArray(data) ? data[0] ?? null : data;

    if (!live) {
      return Response.redirect(canonicalUrl, 302);
    }

    const statusLabel = STATUS_LABELS[live.status] || '';
    const accessLabel = ACCESS_LABELS[live.access_type] || '';
    const dateStr = formatDateBR(live.scheduled_at);

    const ogTitle = live.mentor_name
      ? `${live.title} — com ${live.mentor_name} | EUA Na Pratica`
      : `${live.title} | EUA Na Pratica`;

    const descParts: string[] = [];
    if (statusLabel) descParts.push(statusLabel);
    descParts.push(`${dateStr} · ${live.duration_minutes}min`);
    if (accessLabel) descParts.push(accessLabel);
    if (live.description) descParts.push(live.description);
    const ogDescription = descParts.join(' | ').slice(0, 300);

    const ogImage = live.og_image_url || live.thumbnail_url || `${SITE_URL}/images/landing/landing-page/hero-dashboard-light.png`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(ogTitle)}</title>
  <meta name="description" content="${esc(ogDescription)}" />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="EUA Na Pratica" />
  <meta property="og:title" content="${esc(ogTitle)}" />
  <meta property="og:description" content="${esc(ogDescription)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pt_BR" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@euanapratica" />
  <meta name="twitter:title" content="${esc(ogTitle)}" />
  <meta name="twitter:description" content="${esc(ogDescription)}" />
  <meta name="twitter:image" content="${ogImage}" />
  <script>window.location.replace("${canonicalUrl}");</script>
</head>
<body>
  <p>Redirecionando para <a href="${canonicalUrl}">${esc(live.title)} — Live EUA Na Pratica</a>...</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch {
    return Response.redirect(canonicalUrl, 302);
  }
}
