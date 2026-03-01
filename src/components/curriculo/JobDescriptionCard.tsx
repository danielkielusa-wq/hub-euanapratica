import { FileText } from 'lucide-react';

interface JobDescriptionCardProps {
  value: string;
  onChange: (value: string) => void;
}

export function JobDescriptionCard({ value, onChange }: JobDescriptionCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden min-h-[280px] lg:min-h-[400px]">
      <div className="px-4 py-3 sm:p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between gap-2">
        <h3 className="font-bold text-gray-700 flex items-center gap-2 text-sm sm:text-base">
          <FileText className="w-4 h-4 text-gray-500 shrink-0" />
          Descrição da Vaga
        </h3>
        <span className="text-[10px] sm:text-xs font-medium text-gray-400 shrink-0">Cole o texto abaixo</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 w-full p-4 sm:p-6 text-sm text-gray-600 focus:outline-none resize-none placeholder:text-gray-300 leading-relaxed"
        placeholder={`Ex: Senior Software Engineer @ Google...\n\nCole aqui o texto completo da vaga (LinkedIn, Indeed, site da empresa). Quanto mais detalhes, melhor será a análise.`}
      />
    </div>
  );
}
