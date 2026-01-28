import { FileCheck } from 'lucide-react';
import { QuotaDisplay } from '@/components/curriculo/QuotaDisplay';

export function CurriculoHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-foreground text-background">
          <FileCheck className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Currículo USA</h1>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-full border border-border shadow-sm">
        <QuotaDisplay />
      </div>
    </div>
  );
}
