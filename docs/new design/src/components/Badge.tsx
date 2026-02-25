import React from 'react';
import { cn } from '../lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline' | 'secondary' | 'success' | 'warning' | 'purple' | 'blue';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'default', 
  className, 
  size = 'md', 
  ...props 
}) => {
  const variants = {
    default: 'bg-slate-900 text-white hover:bg-slate-800',
    outline: 'text-slate-950 border border-slate-200 hover:bg-slate-100',
    secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
    success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    warning: 'bg-orange-50 text-orange-700 border border-orange-200',
    purple: 'bg-purple-600 text-white',
    blue: 'bg-blue-600 text-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-0.5 text-xs',
  };

  return (
    <span className={cn(
      'inline-flex items-center justify-center rounded-full font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2',
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
