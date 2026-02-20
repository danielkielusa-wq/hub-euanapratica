import { Briefcase, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JobDescriptionCardProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionCard({ value, onChange }: JobDescriptionCardProps) {
  return (
    <div className="relative h-80 rounded-[32px] border border-gray-200 bg-white shadow-sm overflow-hidden">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cole aqui o texto da vaga (LinkedIn, Indeed, site da empresa)..."
        className="w-full h-full p-6 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent resize-none outline-none"
      />

      {/* Info Tooltip - Top Right */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
            >
              <Info className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-xs">
            <p className="text-sm">
              Cole aqui o texto completo da vaga — encontrado no LinkedIn, Indeed ou site da empresa.
              O ATS compara as palavras da vaga com as do seu currículo, por isso precisa do texto original.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <div className="absolute bottom-4 right-4 flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50">
        <Briefcase className="w-5 h-5 text-gray-300" />
      </div>
    </div>
  );
}
