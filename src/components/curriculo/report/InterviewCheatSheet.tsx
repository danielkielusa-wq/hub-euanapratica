import { HelpCircle } from 'lucide-react';
import type { InterviewQuestion } from '@/types/curriculo';

interface InterviewCheatSheetProps {
  questions: InterviewQuestion[];
}

export function InterviewCheatSheet({ questions }: InterviewCheatSheetProps) {
  return (
    <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900">
          Cheat Sheet: Entrevista
        </h3>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((item, index) => (
          <div key={index} className="flex gap-3">
            <span className="text-sm font-bold text-primary flex-shrink-0">
              {index + 1}.
            </span>
            <div>
              <p className="text-sm font-medium text-gray-900 italic mb-1">
                "{item.question}"
              </p>
              <p className="text-xs text-gray-500">
                {item.context_pt}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
