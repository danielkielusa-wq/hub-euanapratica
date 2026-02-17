import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface V2ReportFooterProps {
  userName: string;
  generatedAt: string;
  reportVersion: string;
}

export function V2ReportFooter({ userName, generatedAt, reportVersion }: V2ReportFooterProps) {
  const formattedDate = generatedAt
    ? format(new Date(generatedAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <footer className="space-y-4 pt-8 border-t border-border/50">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Relatorio de <strong className="text-foreground">{userName}</strong> gerado em {formattedDate}</span>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
          v{reportVersion}
        </Badge>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} EUA na Pratica - Relatorio gerado com IA
      </p>
    </footer>
  );
}
