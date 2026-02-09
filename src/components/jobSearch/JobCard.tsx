import React from 'react';
import {
  Building2,
  Lock,
  ArrowRight,
  CheckCircle2,
  Heart,
  Globe,
  Zap,
  Sparkles
} from 'lucide-react';
import type { Job } from '@/types/jobs';
import {
  formatSalary,
  isNewJob,
  getTimeAgo,
  REMOTE_TYPE_LABELS,
  JOB_TYPE_LABELS,
  EXPERIENCE_LABELS
} from '@/types/jobs';

interface JobCardProps {
  job: Job;
  userPlan: 'free' | 'pro' | 'vip' | 'admin';
  isLocked?: boolean;
  onViewDetails: () => void;
  onBookmark?: () => void;
  onUpgrade?: () => void;
  isBookmarkLoading?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({
  job,
  userPlan,
  isLocked = false,
  onViewDetails,
  onBookmark,
  onUpgrade,
  isBookmarkLoading = false
}) => {
  const isFree = userPlan === 'free';
  const showLocked = isFree && isLocked;

  // Generate company initials for logo
  const companyInitials = job.company_name
    .split(' ')
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Format salary display
  const salaryDisplay = formatSalary(job.salary_min, job.salary_max, job.salary_currency);

  // Check if job is new (less than 48 hours old)
  const isNew = isNewJob(job.created_at);

  const handleCardClick = () => {
    if (showLocked && onUpgrade) {
      onUpgrade();
    } else {
      onViewDetails();
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark && !showLocked) {
      onBookmark();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`
        bg-white rounded-[32px] p-6 border transition-all duration-300 relative flex flex-col group cursor-pointer
        ${showLocked
          ? 'border-gray-100 hover:border-gray-200 opacity-80'
          : 'border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-200 hover:-translate-y-1'}
      `}
    >
      {/* NEW Badge */}
      {isNew && !showLocked && (
        <div className="absolute -top-2 -right-2 px-3 py-1 bg-amber-400 text-white text-[10px] font-black rounded-full shadow-lg flex items-center gap-1">
          <Sparkles size={10} /> NOVO
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-sm overflow-hidden ${
            showLocked ? 'bg-gray-100 text-gray-300' : 'bg-brand-50 text-brand-600'
        }`}>
          {showLocked ? (
            <Lock size={24} />
          ) : job.company_logo_url ? (
            <img
              src={job.company_logo_url}
              alt={job.company_name}
              className="w-full h-full object-cover"
            />
          ) : (
            companyInitials
          )}
        </div>
        <div className="flex gap-2">
          {!showLocked && onBookmark && (
            <button
              onClick={handleBookmarkClick}
              disabled={isBookmarkLoading}
              className={`p-2 transition-colors ${
                isBookmarkLoading ? 'opacity-50' : ''
              } ${
                job.is_bookmarked
                  ? 'text-red-500'
                  : 'text-gray-300 hover:text-red-500'
              }`}
            >
              <Heart
                size={20}
                fill={job.is_bookmarked ? 'currentColor' : 'none'}
              />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-gray-900 leading-tight line-clamp-2">
            {showLocked ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Lock size={18} className="text-gray-300" />
                <span className="blur-[2px] select-none">{job.title}</span>
              </div>
            ) : (
              job.title
            )}
          </h3>
          <p className={`text-sm font-bold flex items-center gap-1.5 ${
            showLocked ? 'text-gray-300' : 'text-gray-500'
          }`}>
            <Building2 size={14} />
            {showLocked
              ? `${job.company_name.substring(0, 3)}***`
              : job.company_name
            }
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 bg-gray-50 text-gray-500 text-[10px] font-black uppercase rounded-lg border border-gray-100 flex items-center gap-1">
            <Globe size={10} /> {REMOTE_TYPE_LABELS[job.remote_type]}
          </span>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg border border-emerald-100 flex items-center gap-1">
            <Zap size={10} /> {JOB_TYPE_LABELS[job.job_type]}
          </span>
          {job.experience_level && (
            <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase rounded-lg border border-purple-100">
              {EXPERIENCE_LABELS[job.experience_level]}
            </span>
          )}
        </div>

        {/* Tech Stack */}
        {job.tech_stack && job.tech_stack.length > 0 && !showLocked && (
          <div className="flex flex-wrap gap-1">
            {job.tech_stack.slice(0, 4).map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[9px] font-bold rounded"
              >
                {tech}
              </span>
            ))}
            {job.tech_stack.length > 4 && (
              <span className="px-2 py-0.5 text-gray-400 text-[9px] font-bold">
                +{job.tech_stack.length - 4} mais
              </span>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-gray-50">
          <div className="flex items-baseline justify-between mb-4">
            <p className="text-xs font-bold text-gray-400">Salário Estimado</p>
            <p className={`font-black ${
              showLocked ? 'text-gray-300 blur-[2px]' : 'text-gray-900'
            }`}>
              {salaryDisplay || 'Não informado'}
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {getTimeAgo(job.created_at)}
            </p>
            {job.is_featured && !showLocked && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded border border-amber-100">
                DESTAQUE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-auto pt-4">
        {showLocked ? (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
                <Lock size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Acesso Bloqueado</p>
                <p className="text-[11px] text-amber-700 font-medium leading-tight">Faça upgrade para ver detalhes e aplicar.</p>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpgrade?.();
              }}
              className="w-full py-4 bg-gray-100 text-gray-400 font-black rounded-2xl text-xs flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
            >
              VER PLANOS <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            disabled={job.is_applied}
            className={`w-full py-4 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
                job.is_applied
                ? 'bg-green-50 text-green-600 border border-green-200'
                : 'bg-gray-900 hover:bg-black text-white shadow-gray-900/20 hover:-translate-y-0.5'
            }`}
          >
            {job.is_applied ? (
              <><CheckCircle2 size={16} /> VISITADO</>
            ) : (
              <>Ver Detalhes <ArrowRight size={14} /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default JobCard;
