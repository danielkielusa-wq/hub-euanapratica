import { Link } from 'react-router-dom';
import { Globe, Printer, X, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ReportHeaderProps {
  onPrint?: () => void;
  onClose?: () => void;
}

export function ReportHeader({ onPrint, onClose }: ReportHeaderProps) {
  const { user } = useAuth();

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-white/20 shadow-sm print:hidden">
      <div className="max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {user && (
            <>
              <Link
                to="/dashboard/hub"
                className="flex items-center gap-1 text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Meu Hub</span>
              </Link>
              <div className="w-px h-5 bg-border shrink-0" />
            </>
          )}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1e3a8a] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">Relatório Individual</h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Diagnóstico de Carreira Internacional</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Imprimir</span>
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="rounded-xl h-8 w-8 sm:h-9 sm:w-9"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
