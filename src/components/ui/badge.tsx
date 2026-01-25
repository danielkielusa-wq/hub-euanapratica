import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Pastel variants for premium Fintech UI
        pastelPurple: "border-0 bg-[hsl(var(--badge-purple))] text-[hsl(var(--badge-purple-text))]",
        pastelRose: "border-0 bg-[hsl(var(--badge-rose))] text-[hsl(var(--badge-rose-text))]",
        pastelEmerald: "border-0 bg-[hsl(var(--badge-emerald))] text-[hsl(var(--badge-emerald-text))]",
        pastelAmber: "border-0 bg-[hsl(var(--badge-amber))] text-[hsl(var(--badge-amber-text))]",
        pastelSlate: "border-0 bg-[hsl(var(--badge-slate))] text-[hsl(var(--badge-slate-text))]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
