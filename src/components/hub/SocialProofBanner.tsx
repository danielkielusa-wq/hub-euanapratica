import { ArrowRight, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const SAMPLE_AVATARS = [
  { initials: 'JC', color: 'bg-blue-500' },
  { initials: 'ML', color: 'bg-green-500' },
  { initials: 'AS', color: 'bg-purple-500' },
];

export function SocialProofBanner() {
  return (
    <div className="rounded-3xl bg-slate-50 p-6 dark:bg-slate-900/50">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar Stack */}
          <div className="flex -space-x-2">
            {SAMPLE_AVATARS.map((avatar, i) => (
              <Avatar 
                key={i} 
                className="h-10 w-10 border-2 border-background"
              >
                <AvatarFallback className={avatar.color + ' text-white text-xs font-semibold'}>
                  {avatar.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-background bg-primary/10 text-xs font-bold text-primary">
              +50
            </div>
          </div>

          {/* Text */}
          <div>
            <p className="font-medium text-foreground">
              Junte-se aos alunos que já estão nos EUA
            </p>
            <p className="text-sm text-muted-foreground">
              Mentorados Pro e VIP têm 40% mais chances de convite para entrevistas.
            </p>
          </div>
        </div>

        {/* CTA */}
        <Button variant="link" className="gap-1 text-primary">
          Ver histórias de sucesso
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
