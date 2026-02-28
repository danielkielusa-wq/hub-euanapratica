import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface LinkedInJobRaw {
  job_title: string;
  post_link: string;
  company_name?: string;
  salary_min_usd?: number;
  salary_max_usd?: number;
  job_category?: string;
  seniority_level?: string;
}

interface JobImportPreviewProps {
  jobs: LinkedInJobRaw[];
}

export function JobImportPreview({ jobs }: JobImportPreviewProps) {
  const validCount = jobs.filter((j) => j.job_title && j.post_link).length;
  const invalidCount = jobs.length - validCount;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-sm font-bold">
        <span className="flex items-center gap-1.5 text-green-600">
          <CheckCircle size={16} /> {validCount} válidas
        </span>
        {invalidCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-500">
            <XCircle size={16} /> {invalidCount} inválidas
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">#</th>
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Título</th>
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Empresa</th>
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Salário</th>
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Categoria</th>
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Nível</th>
              <th className="px-4 py-3 font-bold text-xs text-gray-500 uppercase tracking-wide">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job, i) => {
              const isValid = !!job.job_title && !!job.post_link;
              return (
                <tr key={i} className={!isValid ? 'bg-red-50/50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-gray-900 max-w-xs truncate">
                    {job.job_title || <span className="text-red-400 italic">Sem título</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.company_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {job.salary_min_usd
                      ? `$${job.salary_min_usd.toLocaleString()}${job.salary_max_usd && job.salary_max_usd !== job.salary_min_usd ? ` - $${job.salary_max_usd.toLocaleString()}` : ''}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{job.job_category || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{job.seniority_level || '—'}</td>
                  <td className="px-4 py-3">
                    {isValid ? (
                      <CheckCircle size={16} className="text-green-500" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
