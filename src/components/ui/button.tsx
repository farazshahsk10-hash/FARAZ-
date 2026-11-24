import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[0.625rem] text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E2B25] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F0] disabled:pointer-events-none disabled:opacity-50 cursor-pointer shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#9E2B25] text-[#FFFDF8] shadow-sm hover:bg-[#8A241F]',
        dark: 'bg-[#2E1F16] text-[#FAF7F0] shadow-sm hover:bg-[#3B2A1E]',
        secondary: 'bg-[#F3ECDF] text-[#3B2A1E] border border-[#E5D9C3] hover:bg-[#EAE0CE]',
        outline: 'border border-[#E5D9C3] bg-[#FFFDF8] text-[#3B2A1E] hover:bg-[#F3ECDF]',
        outlineLight: 'border border-[#C89B5A]/50 bg-transparent text-[#FAF7F0] hover:bg-white/10',
        ghost: 'text-[#3B2A1E] hover:bg-[#F3ECDF]',
        ghostLight: 'text-[#FAF7F0] hover:bg-white/10',
        destructive: 'bg-[#9E2B25]/10 text-[#9E2B25] border border-[#9E2B25]/25 hover:bg-[#9E2B25] hover:text-white',
      },
      size: {
        default: 'min-h-[44px] sm:min-h-[40px] px-4 py-2',
        sm: 'min-h-[40px] sm:min-h-[36px] px-3 py-1.5 text-xs',
        lg: 'min-h-[48px] px-6 py-3 text-base',
        icon: 'min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] p-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
