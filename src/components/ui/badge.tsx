import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-[0.375rem] border px-2.5 py-0.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0',
  {
    variants: {
      variant: {
        default: 'border-[#E5D9C3] bg-[#F3ECDF] text-[#3B2A1E]',
        red: 'border-[#9E2B25]/25 bg-[#9E2B25]/10 text-[#9E2B25]',
        gold: 'border-[#C89B5A]/40 bg-[#C89B5A]/15 text-[#B07A3F]',
        green: 'border-[#5F7A5A]/30 bg-[#5F7A5A]/12 text-[#5F7A5A]',
        dark: 'border-[#2E1F16] bg-[#2E1F16] text-[#FAF7F0]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
