import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import ServiceLandingPage from '@/components/services/ServiceLandingPage';
import { useServiceLandingPage } from '@/hooks/useServiceLandingPage';

const ServiceDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, error } = useServiceLandingPage({ slug });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">Carregando serviço...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !service) {
    return <Navigate to="/dashboard/hub" replace />;
  }

  return (
    <DashboardLayout>
      <ServiceLandingPage service={service} />
    </DashboardLayout>
  );
};

export default ServiceDetail;
