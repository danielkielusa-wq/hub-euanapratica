import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  /** Show a back arrow that navigates to this path */
  backTo?: string;
  /** Action buttons rendered on the right side */
  children?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, icon: Icon, backTo, children, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}>
      <div className="flex items-center gap-3 min-w-0">
        {backTo && (
          <Button variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={() => navigate(backTo)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}

        {Icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
        )}

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>

      {children && (
        <div className="flex items-center gap-2 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}
