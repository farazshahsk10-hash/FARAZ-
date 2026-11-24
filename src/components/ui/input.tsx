import * as React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex min-h-[44px] sm:min-h-[40px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2 text-sm text-[#3B2A1E] placeholder:text-[#7A6A58]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E2B25] focus-visible:border-[#9E2B25] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'flex min-h-[92px] w-full rounded-[0.625rem] border border-[#E5D9C3] bg-[#FFFDF8] px-3.5 py-2.5 text-sm text-[#3B2A1E] placeholder:text-[#7A6A58]/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E2B25] focus-visible:border-[#9E2B25] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';
