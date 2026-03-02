import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DOMPurify from 'dompurify';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

interface LegalPageProps {
  configKey: string;
  title: string;
}

export default function LegalPage({ configKey, title }: LegalPageProps) {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchContent() {
      const { data, error: rpcError } = await supabase.rpc('get_legal_page_content', {
        p_page_key: configKey,
      });

      if (rpcError) {
        setError('Não foi possível carregar o conteúdo.');
        console.error('Error fetching legal page:', rpcError);
      } else if (data && data.length > 0) {
        setContent(data[0].value);
      } else {
        setError('Conteúdo não encontrado.');
      }

      setIsLoading(false);
    }

    fetchContent();
  }, [configKey]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>

          <div className="bg-card border border-border rounded-[32px] p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
              {title}
            </h1>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <p className="text-destructive py-10">{error}</p>
            ) : (
              <div
                className="prose prose-sm max-w-none text-muted-foreground [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-8 [&_h2]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-1 [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
              />
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
