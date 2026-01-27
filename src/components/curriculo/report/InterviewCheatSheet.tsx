import { useState } from 'react';
import { HelpCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { InterviewQuestion } from '@/types/curriculo';

interface InterviewCheatSheetProps {
  questions: InterviewQuestion[];
}

export function InterviewCheatSheet({ questions }: InterviewCheatSheetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const goToPrevious = () => setCurrentIndex(i => Math.max(0, i - 1));
  const goToNext = () => setCurrentIndex(i => Math.min(questions.length - 1, i + 1));

  const currentQuestion = questions[currentIndex];

  if (!questions.length) return null;

  return (
    <div className="bg-background rounded-[32px] border border-border shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground">
            Cheat Sheet: Entrevista
          </h3>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[40px] text-center">
            {currentIndex + 1}/{questions.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-muted/30 rounded-2xl p-6 space-y-4">
        <p className="text-base font-medium text-foreground italic leading-relaxed">
          "{currentQuestion.question}"
        </p>

        {/* Expandable Recruiter Perspective */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between rounded-xl h-10 text-sm font-medium"
            >
              <span className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Perspectiva do Recrutador
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="bg-background rounded-xl p-4 border border-border">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentQuestion.context_pt}
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
