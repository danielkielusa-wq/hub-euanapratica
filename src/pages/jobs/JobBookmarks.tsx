import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Search, ArrowRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import JobCard from '@/components/jobSearch/JobCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { UpgradeModal } from '@/components/curriculo/UpgradeModal';
import { useJobBookmarks, useToggleBookmark } from '@/hooks/useJobBookmarks';
import { usePlanAccess } from '@/hooks/usePlanAccess';
import type { Job } from '@/types/jobs';

export default function JobBookmarks() {
  const navigate = useNavigate();
  const { planId, isPremiumPlan, isVipPlan } = usePlanAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Determine user plan
  const userPlan = isVipPlan ? 'vip' : isPremiumPlan ? 'pro' : 'free';
  const hasAccess = userPlan !== 'free';

  // Fetch bookmarks
  const { data: bookmarks, isLoading } = useJobBookmarks();

  // Bookmark mutation
  const toggleBookmark = useToggleBookmark();

  const handleViewDetails = (job: Job) => {
    navigate(`/prime-jobs/${job.id}`);
  };

  const handleRemoveBookmark = (job: Job) => {
    toggleBookmark.mutate({
      jobId: job.id,
      isBookmarked: true, // We're removing, so it's currently bookmarked
    });
  };

  // If free user, show upgrade prompt
  if (!hasAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto p-6">
          <div className="text-center py-20 bg-white rounded-[32px] border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-4">
              Vagas Salvas - Recurso Premium
            </h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Faça upgrade para VIP ou Pro para salvar suas vagas favoritas e acessá-las rapidamente.
            </p>
            <Button
              onClick={() => setShowUpgradeModal(true)}
              className="bg-brand-600 hover:bg-brand-700"
            >
              Ver Planos <ArrowRight size={16} className="ml-2" />
            </Button>
          </div>

          <UpgradeModal
            open={showUpgradeModal}
            onOpenChange={setShowUpgradeModal}
            currentPlanId={planId}
            reason="upgrade"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="animate-fade-in space-y-8 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Heart className="h-8 w-8 text-red-500" fill="currentColor" />
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                Minhas Vagas Salvas
              </h1>
            </div>
            <p className="text-gray-500 font-medium">
              {bookmarks?.length || 0} vaga{(bookmarks?.length || 0) !== 1 ? 's' : ''} salva{(bookmarks?.length || 0) !== 1 ? 's' : ''}
            </p>
          </div>

          <Button
            onClick={() => navigate('/prime-jobs')}
            variant="outline"
            className="rounded-xl"
          >
            <Search size={18} className="mr-2" />
            Explorar Mais Vagas
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 rounded-[32px]" />
            ))}
          </div>
        ) : !bookmarks || bookmarks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-8 w-8 text-red-300" />
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">
              Nenhuma vaga salva
            </h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
              Explore as vagas disponíveis e salve suas favoritas para acessar rapidamente depois.
            </p>
            <Button onClick={() => navigate('/prime-jobs')}>
              Explorar Vagas
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
            {bookmarks.map((bookmark) => {
              const job = bookmark.job as Job;
              if (!job) return null;

              return (
                <JobCard
                  key={bookmark.id}
                  job={{ ...job, is_bookmarked: true }}
                  userPlan={userPlan}
                  isLocked={false}
                  onViewDetails={() => handleViewDetails(job)}
                  onBookmark={() => handleRemoveBookmark(job)}
                  isBookmarkLoading={toggleBookmark.isPending}
                />
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
