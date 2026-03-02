import { FileText } from 'lucide-react';

export function CurriculoHeader() {
  return (
    <div>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 bg-indigo-100 rounded-lg shrink-0">
          <FileText className="w-5 h-5 text-[#7367F0]" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">ResumePass AI</h1>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
        Compare seu CV com a vaga desejada e vença o ATS. Nossa IA simula os robôs de recrutamento dos EUA para te dar um score real.
      </p>
    </div>
  );
}
