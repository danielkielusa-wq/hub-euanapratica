import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import JobDetailsPage from './JobDetailsPage';
import JobPublicPreview from './JobPublicPreview';

/**
 * Auth-aware wrapper for /prime-jobs/:id
 * - Authenticated users see the full job details page
 * - Unauthenticated visitors see a minimal public preview (lead acquisition)
 */
export default function JobDetailsWrapper() {
  const { user, isLoading } = useAuth();

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

  if (!user) {
    return <JobPublicPreview />;
  }

  return <JobDetailsPage />;
}
