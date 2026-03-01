import React from 'react';
import {
  Briefcase,
  Lock,
  ArrowRight,
  CheckCircle2,
  Heart,
  Globe,
  Clock
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

const getTagStyle = (type: string) => {
  switch (type) {
    case 'remote_type': return 'bg-gray-100 text-gray-600 border-gray-200';
    case 'job_type': return 'bg-green-50 text-green-600 border-green-100';
    case 'experience': return 'bg-purple-50 text-purple-600 border-purple-100';
    default: return 'bg-gray-100 text-gray-600 border-gray-200';
  }
};

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
        bg-white rounded-2xl border p-5 relative transition-all duration-300 group cursor-pointer
        ${showLocked
          ? 'border-gray-200 opacity-80 hover:opacity-100'
          : job.is_applied
            ? 'border-gray-200 opacity-80 hover:opacity-100'
            : 'border-gray-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-50'}
      `}
    >
      {/* NEW Badge */}
      {isNew && !showLocked && (
        <div className="absolute top-0 right-0 bg-yellow-400 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl shadow-sm z-10">
          NOVO
        </div>
      )}

      <div className="flex gap-5">
        {/* Left: Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3 className="font-bold text-gray-800 text-base leading-snug mb-1.5 group-hover:text-blue-600 transition-colors">
            {showLocked ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Lock className="w-4 h-4 text-gray-300 shrink-0" />
                <span className="blur-[2px] select-none">{job.title}</span>
              </div>
            ) : (
              job.title
            )}
          </h3>

          {/* Company */}
          <div className={`flex items-center gap-1.5 text-sm mb-3 ${
            showLocked ? 'text-gray-300' : 'text-gray-500'
          }`}>
            <Briefcase className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {showLocked
                ? `${job.company_name.substring(0, 3)}***`
                : job.company_name
              }
            </span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getTagStyle('remote_type')}`}>
              <Globe className="w-3 h-3" />
              {REMOTE_TYPE_LABELS[job.remote_type]}
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${getTagStyle('job_type')}`}>
              {JOB_TYPE_LABELS[job.job_type]}
            </span>
            {job.experience_level && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getTagStyle('experience')}`}>
                {EXPERIENCE_LABELS[job.experience_level]}
              </span>
            )}
          </div>

          {/* Tech Stack */}
          {job.tech_stack && job.tech_stack.length > 0 && !showLocked && (
            <div className="flex flex-wrap gap-1 mb-3">
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

          {/* Time */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium uppercase tracking-wide">
              <Clock className="w-3 h-3" />
              {getTimeAgo(job.created_at)}
            </div>
            {job.is_featured && !showLocked && (
              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-bold rounded border border-amber-100">
                DESTAQUE
              </span>
            )}
          </div>
        </div>

        {/* Right: Salary + Action + Bookmark */}
        <div className="flex flex-col items-end justify-between shrink-0 w-44">
          {/* Bookmark */}
          <div className="flex items-center gap-2">
            {!showLocked && onBookmark && (
              <button
                onClick={handleBookmarkClick}
                disabled={isBookmarkLoading}
                className={`p-1.5 rounded-full transition-all ${
                  isBookmarkLoading ? 'opacity-50' : ''
                } ${
                  job.is_bookmarked
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-300 hover:bg-gray-50 hover:text-red-400'
                }`}
              >
                <Heart
                  className={`w-4 h-4 ${job.is_bookmarked ? 'fill-current' : ''}`}
                />
              </button>
            )}
          </div>

          {/* Salary */}
          <div className="text-right mb-3">
            <div className="text-[10px] text-gray-400 font-medium mb-0.5">Salário</div>
            <div className={`font-bold text-sm ${
              showLocked ? 'text-gray-300 blur-[2px]' : 'text-gray-800'
            }`}>
              {salaryDisplay || 'A combinar'}
            </div>
          </div>

          {/* Action Button */}
          {showLocked ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpgrade?.();
              }}
              className="w-full py-2 bg-gray-100 text-gray-400 font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <Lock className="w-3 h-3" /> VER PLANOS
            </button>
          ) : job.is_applied ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="w-full py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 font-bold text-[11px] flex items-center justify-center gap-1.5 hover:bg-green-100 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              VISITADO
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails();
              }}
              className="w-full py-2 rounded-lg bg-[#1e1e2d] text-white font-bold text-[11px] flex items-center justify-center gap-1.5 group-hover:bg-[#2b2b40] transition-colors shadow-md shadow-gray-200"
            >
              Ver Detalhes
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
