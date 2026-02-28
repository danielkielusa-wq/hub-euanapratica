import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

interface HelpSection {
  title: string;
  content: string;
  steps?: string[];
}

interface PageHelpButtonProps {
  pageTitle: string;
  description: string;
  sections: HelpSection[];
}

export function PageHelpButton({ pageTitle, description, sections }: PageHelpButtonProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1.5">
          <HelpCircle className="w-3.5 h-3.5" />
          Como usar
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-500" />
            {pageTitle}
          </SheetTitle>
          <p className="text-sm text-gray-500">{description}</p>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">{section.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
              {section.steps && section.steps.length > 0 && (
                <ol className="mt-2 space-y-1.5">
                  {section.steps.map((step, idx) => (
                    <li key={idx} className="text-xs text-gray-600 flex gap-2">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                        {idx + 1}
                      </span>
                      <span className="pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
