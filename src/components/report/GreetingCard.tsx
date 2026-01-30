import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

interface GreetingCardProps {
  greeting: {
    title: string;
    subtitle: string;
    phase_highlight: string;
    phase_description: string;
  };
}

export function GreetingCard({ greeting }: GreetingCardProps) {
  return (
    <Card className="rounded-[40px] overflow-hidden border-0 shadow-lg">
      <div className="bg-gradient-to-br from-[#2563EB]/10 via-[#1e3a8a]/5 to-transparent p-8 md:p-10">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
          {greeting.title}
        </h2>
        <p className="mt-4 text-muted-foreground leading-relaxed">
          {greeting.subtitle}
        </p>
        
        {/* Phase Highlight Box */}
        <div className="mt-6 p-5 rounded-[24px] bg-gradient-to-r from-[#1e3a8a] to-[#2563EB] text-white">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            <span className="font-semibold text-sm uppercase tracking-wide">
              {greeting.phase_highlight}
            </span>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            {greeting.phase_description}
          </p>
        </div>
      </div>
    </Card>
  );
}
