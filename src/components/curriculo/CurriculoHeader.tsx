import { FileCheck, Infinity } from 'lucide-react';

export function CurriculoHeader() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-900 text-white">
          <FileCheck className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-gray-900">Currículo USA</h1>
      </div>
      
      <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm">
        <Infinity className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-600">Créditos</span>
      </div>
    </div>
  );
}
