import type { IncomingMessage, ServerResponse } from 'http';

// Vercel Serverless Function types
interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
}
interface VercelResponse extends ServerResponse {
  status(code: number): VercelResponse;
  send(body: string): VercelResponse;
  redirect(statusOrUrl: number | string, url?: string): VercelResponse;
  setHeader(name: string, value: string): this;
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://seqgnxynrcylxsdzbloa.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';
const SITE_URL = process.env.SITE_URL || 'https://hub.euanapratica.com';

interface JobPreview {
  id: string;
  title: string;
  company_name: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  remote_type: string;
  experience_level: string;
  job_type: string;
  category: string;
  industry: string | null;
}

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

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.redirect(302, SITE_URL);
  }

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/rest/v1/rpc/get_job_public_preview`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ p_job_id: id }),
      },
    );

    if (!resp.ok) {
      return res.redirect(302, `${SITE_URL}/prime-jobs/${id}`);
    }

    const data = await resp.json();
    const job: JobPreview | null = Array.isArray(data) ? data[0] ?? null : data;

    if (!job) {
      return res.redirect(302, `${SITE_URL}/prime-jobs/${id}`);
    }

    const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
    const remoteLabel = REMOTE_LABELS[job.remote_type] || job.remote_type;
    const jobTypeLabel = JOB_TYPE_LABELS[job.job_type] || job.job_type;

    // Build rich OG title — include salary for attention
    const ogTitle = salary
      ? `${job.title} — ${salary} | Prime Jobs`
      : `${job.title} | Prime Jobs`;

    // Build description with key details
    const descParts: string[] = [
      `${job.company_name}`,
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
  <title>${escapeHtml(ogTitle)}</title>
  <meta name="description" content="${escapeHtml(ogDescription)}" />
  <link rel="canonical" href="${canonicalUrl}" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${canonicalUrl}" />
  <meta property="og:site_name" content="EUA Na Prática — Prime Jobs" />
  <meta property="og:title" content="${escapeHtml(ogTitle)}" />
  <meta property="og:description" content="${escapeHtml(ogDescription)}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:locale" content="pt_BR" />

  <!-- Twitter / X -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@euanapratica" />
  <meta name="twitter:title" content="${escapeHtml(ogTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(ogDescription)}" />
  <meta name="twitter:image" content="${ogImage}" />

  <!-- Redirect real users to the SPA -->
  <meta http-equiv="refresh" content="0;url=${canonicalUrl}" />
</head>
<body>
  <p>Redirecionando para <a href="${canonicalUrl}">${escapeHtml(job.title)} — Prime Jobs</a>...</p>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).send(html);
  } catch {
    return res.redirect(302, `${SITE_URL}/prime-jobs/${id}`);
  }
}
