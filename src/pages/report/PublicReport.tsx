import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ReportGatekeeper } from '@/components/report/ReportGatekeeper';
import { FormattedReport } from '@/components/report/FormattedReport';
import { Loader2 } from 'lucide-react';
import type { CareerEvaluation } from '@/types/leads';

export default function PublicReport() {
  const { token } = useParams<{ token: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [error, setError] = useState<string>('');
  const [evaluation, setEvaluation] = useState<CareerEvaluation | null>(null);
  const [formattedContent, setFormattedContent] = useState<string>('');
  const [tokenValid, setTokenValid] = useState(false);

  useEffect(() => {
    checkToken();
  }, [token]);

  const checkToken = async () => {
    if (!token) {
      setError('Link inválido');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('verify-report-access', {
        body: { token, action: 'check' }
      });

      if (fetchError || !data?.valid) {
        setError('Este link não existe ou expirou.');
      } else {
        setTokenValid(true);
      }
    } catch (err) {
      setError('Erro ao verificar link.');
    }
    setIsLoading(false);
  };

  const handleVerify = async (email: string): Promise<boolean> => {
    setIsVerifying(true);
    setError('');

    try {
      const { data, error: verifyError } = await supabase.functions.invoke('verify-report-access', {
        body: { token, email, action: 'verify' }
      });

      if (verifyError) {
        setError('Erro ao verificar. Tente novamente.');
        setIsVerifying(false);
        return false;
      }

      if (!data?.success) {
        setError(data?.message || 'Email não corresponde ao relatório.');
        setIsVerifying(false);
        return false;
      }

      setEvaluation(data.evaluation);
      setIsVerifying(false);
      
      const formattedAt = data.evaluation.formatted_at ? new Date(data.evaluation.formatted_at).getTime() : 0;
      const updatedAt = data.evaluation.updated_at ? new Date(data.evaluation.updated_at).getTime() : 0;
      const isStale = formattedAt > 0 && updatedAt > formattedAt;

      if (data.evaluation.formatted_report && !isStale) {
        setFormattedContent(data.evaluation.formatted_report);
      } else {
        // Request AI formatting (force refresh if stale)
        setIsFormatting(true);
        try {
          const { data: formatted, error: formatError } = await supabase.functions.invoke('format-lead-report', {
            body: { evaluationId: data.evaluation.id, forceRefresh: isStale }
          });
          
          if (!formatError && formatted?.content) {
            // Store as JSON string for the component to parse
            setFormattedContent(
              typeof formatted.content === 'string' 
                ? formatted.content 
                : JSON.stringify(formatted.content)
            );
          }
        } catch (formatErr) {
          // Will show fallback with raw content
        }
        setIsFormatting(false);
      }

      return true;
    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
      setIsVerifying(false);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tokenValid && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Link Inválido</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (evaluation) {
    return (
      <FormattedReport 
        evaluation={evaluation} 
        formattedContent={formattedContent}
        isLoading={isFormatting}
      />
    );
  }

  return (
    <ReportGatekeeper 
      onVerify={handleVerify} 
      isLoading={isVerifying} 
      error={error} 
    />
  );
}
