import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl font-medium',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          // Variants
          variant === 'primary' &&
            'bg-white text-black hover:bg-white/90',
          variant === 'secondary' &&
            'bg-white/10 text-white hover:bg-white/20',
          variant === 'outline' &&
            'bg-transparent border border-white/20 text-white hover:border-white/40',
          // Sizes
          size === 'sm' && 'px-4 py-2 text-sm',
          size === 'md' && 'px-6 py-3 text-base',
          size === 'lg' && 'px-8 py-4 text-lg',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
