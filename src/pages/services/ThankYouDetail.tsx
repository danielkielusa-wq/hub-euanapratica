import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ServiceThankYouPage from '@/components/services/ServiceThankYouPage';
import { useServiceThankYouPage } from '@/hooks/useServiceThankYouPage';

const ThankYouDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading, error } = useServiceThankYouPage({ slug });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return <Navigate to="/dashboard/hub" replace />;
  }

  return <ServiceThankYouPage service={service} />;
};

export default ThankYouDetail;
