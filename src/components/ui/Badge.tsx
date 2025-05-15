import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-dark-800 text-dark-300 border border-dark-700',
        primary: 'bg-brand-500/10 text-brand-300 border border-brand-500/20',
        secondary: 'bg-accent-500/10 text-accent-300 border border-accent-500/20',
        success: 'bg-green-500/10 text-green-300 border border-green-500/20',
        warning: 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20',
        danger: 'bg-red-500/10 text-red-300 border border-red-500/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };