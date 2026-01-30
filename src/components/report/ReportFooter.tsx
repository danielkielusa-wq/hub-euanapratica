import { Button } from '@/components/ui/button';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ReportFooterProps {
  generatedAt?: string;
  onDownloadPDF?: () => void;
}

export function ReportFooter({ generatedAt, onDownloadPDF }: ReportFooterProps) {
  const formattedDate = generatedAt 
    ? format(new Date(generatedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <footer className="space-y-6 pt-8 border-t border-border/50">
      {/* Generated Date */}
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Calendar className="w-4 h-4" />
        <span>Relatório gerado em {formattedDate}</span>
      </div>
      
      {/* Download CTA */}
      {onDownloadPDF && (
        <div className="flex justify-center">
          <Button 
            onClick={onDownloadPDF}
            size="lg"
            className="rounded-[16px] gap-2 px-8 py-6 text-base font-semibold bg-gradient-to-r from-[#2563EB] to-[#1e3a8a] hover:opacity-90 shadow-lg shadow-blue-500/20"
          >
            <Download className="w-5 h-5" />
            Baixar PDF Completo
          </Button>
        </div>
      )}
      
      {/* Footer Text */}
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} EUA na Prática - Relatório gerado com IA
      </p>
    </footer>
  );
}
