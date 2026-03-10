export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://seqgnxynrcylxsdzbloa.supabase.co';
const SITE_URL = 'https://hub.euanapratica.com';

const REMOTE_LABELS: Record<string, string> = {
  fully_remote: 'Remoto',
  hybrid: 'Híbrido',
  onsite: 'Presencial',
};

const JOB_TYPE_LABELS: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contrato',
  freelance: 'Freelance',
};

function formatSalary(min: number | null, max: number | null, currency = 'USD'): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min && max) return `${fmt(min)} - ${fmt(max)}`;
  if (min) return `${fmt(min)}+`;
  if (max) return `Até ${fmt(max)}`;
  return '';
}

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return Response.redirect(SITE_URL, 302);
  }

  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    '';

  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_job_public_preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ p_job_id: id }),
    });

    if (!resp.ok) {
      return Response.redirect(`${SITE_URL}/prime-jobs/${id}`, 302);
    }

    const data = await resp.json();
    const job = Array.isArray(data) ? data[0] ?? null : data;

    if (!job) {
      return Response.redirect(`${SITE_URL}/prime-jobs/${id}`, 302);
    }

    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
    const remoteLabel = REMOTE_LABELS[job.remote_type] || job.remote_type;
    const jobTypeLabel = JOB_TYPE_LABELS[job.job_type] || job.job_type;

    const ogTitle = salary
      ? `${job.title} — ${salary} | Prime Jobs`
      : `${job.title} | Prime Jobs`;

    const descParts: string[] = [
      job.company_name,
      `${remoteLabel} · ${jobTypeLabel}`,
    ];
    if (salary) descParts.push(salary);
    if (job.industry) descParts.push(job.industry);
    descParts.push('Vaga curada para brasileiros em empresas americanas.');
    const ogDescription = descParts.join(' | ');

    const ogImage = `${SITE_URL}/images/landing/landing-page/hero-dashboard-light.png`;
    const canonicalUrl = `${SITE_URL}/prime-jobs/${id}`;

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
  <meta property="og:site_name" content="EUA Na Pratica — Prime Jobs" />
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
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
</head>
<body>
  <p>Redirecionando para <a href="${canonicalUrl}">${esc(job.title)} — Prime Jobs</a>...</p>
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
    return Response.redirect(`${SITE_URL}/prime-jobs/${id}`, 302);
  }
}
