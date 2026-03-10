import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, LogIn, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { formatSalary } from '@/types/jobs';
import type { JobPublicPreview as JobPublicPreviewType } from '@/types/jobs';

export default function JobPublicPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job-public-preview', id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_job_public_preview', {
        p_job_id: id!,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      return row as JobPublicPreviewType | null;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          <Skeleton className="h-16 rounded-3xl" />
          <Skeleton className="h-48 rounded-[40px]" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-[40px] p-12 border border-gray-100 max-w-md w-full">
          <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-black text-gray-900 mb-2">Vaga não encontrada</h2>
          <p className="text-gray-500 text-sm mb-6">
            Esta vaga não está mais disponível ou foi removida.
          </p>
          <Button onClick={() => navigate('/cadastro')}>
            Criar Conta Gratuita
          </Button>
        </div>
      </div>
    );
  }

  const salaryDisplay = formatSalary(job.salary_min, job.salary_max, job.salary_currency);
  const redirectUrl = `/prime-jobs/${id}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-brand-50/30 flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-8 animate-fade-in">
        {/* Brand Header */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Prime Jobs
          </h1>
          <p className="text-sm text-gray-500 font-medium mt-1">
            by EUA Na Prática
          </p>
        </div>

        {/* Job Card Preview — Minimal */}
        <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-xl shadow-gray-100/50 relative overflow-hidden">
          {/* Decorative blur */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-50 opacity-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10 space-y-6">
            {/* Job Title — Visible */}
            <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">
              {job.title}
            </h2>

            {/* Salary — Visible */}
            {salaryDisplay && (
              <div className="inline-block px-4 py-2 bg-green-50 text-green-700 font-black text-sm rounded-xl border border-green-100">
                {salaryDisplay}
              </div>
            )}

            {/* Blurred placeholder sections */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-100 rounded-full w-3/4 blur-[2px]" />
              <div className="h-4 bg-gray-100 rounded-full w-1/2 blur-[2px]" />
              <div className="h-4 bg-gray-100 rounded-full w-2/3 blur-[2px]" />
              <div className="h-4 bg-gray-100 rounded-full w-1/3 blur-[2px]" />
            </div>

            <div className="space-y-3">
              <div className="h-3 bg-gray-50 rounded-full w-full blur-[3px]" />
              <div className="h-3 bg-gray-50 rounded-full w-5/6 blur-[3px]" />
              <div className="h-3 bg-gray-50 rounded-full w-4/5 blur-[3px]" />
              <div className="h-3 bg-gray-50 rounded-full w-3/4 blur-[3px]" />
            </div>
          </div>

          {/* Lock Overlay */}
          <div className="absolute inset-0 rounded-[40px] flex flex-col items-center justify-end pb-12">
            <div className="absolute inset-0 bg-white/95 rounded-[40px]" style={{ top: '45%' }} />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mb-3">
                <Lock size={20} />
              </div>
              <p className="text-[15px] font-semibold text-gray-600 text-center max-w-[260px] leading-relaxed">
                Crie sua conta gratuita para ver todos os detalhes desta vaga
              </p>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate(`/cadastro?redirect=${encodeURIComponent(redirectUrl)}`)}
            className="w-full py-6 bg-brand-600 hover:bg-brand-700 text-white font-black text-base rounded-2xl shadow-xl shadow-brand-600/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            Criar Conta Gratuita <ArrowRight size={18} className="ml-2" />
          </Button>

          <button
            onClick={() => navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`)}
            className="w-full py-4 text-gray-500 hover:text-gray-900 font-bold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={16} />
            Já tem conta? Faça login
          </button>
        </div>

        {/* Social proof */}
        <p className="text-center text-xs text-gray-400 font-medium">
          Vagas remotas curadas para brasileiros trabalharem em empresas americanas
        </p>
      </div>
    </div>
  );
}
