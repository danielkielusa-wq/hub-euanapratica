import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
}

export function AuthLayout({ children, title, subtitle, showCloseButton = true }: AuthLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="relative w-full max-w-md bg-white rounded-[24px] shadow-xl p-8">
        {/* Close Button */}
        {showCloseButton && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 h-8 w-8 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            onClick={() => navigate('/')}
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-6">
            {title && (
              <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
