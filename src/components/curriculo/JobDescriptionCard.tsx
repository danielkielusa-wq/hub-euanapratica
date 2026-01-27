import { Briefcase } from 'lucide-react';

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
        placeholder="Cole aqui a Descrição da Vaga (Job Description) que você deseja aplicar..."
        className="w-full h-full p-6 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent resize-none outline-none"
      />
      
      <div className="absolute bottom-4 right-4 flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50">
        <Briefcase className="w-5 h-5 text-gray-300" />
      </div>
    </div>
  );
}
