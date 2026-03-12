import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, children, loading, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-white text-black font-semibold shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_50px_rgba(255,255,255,0.15)]',
      secondary:
        'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20',
      ghost: 'text-white/70 hover:text-white hover:bg-white/5',
      danger:
        'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20',
      outline:
        'bg-transparent border border-white/20 text-white hover:border-white/40',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs rounded-lg',
      md: 'px-6 py-3 text-sm rounded-xl',
      lg: 'px-8 py-4 text-base rounded-xl',
    };

    return (
      <motion.button
        ref={ref}
        className={cn(
          'relative overflow-hidden font-medium transition-all duration-300 flex items-center justify-center gap-2',
          variants[variant],
          sizes[size],
          (disabled || loading) && 'opacity-50 pointer-events-none',
          className
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        disabled={disabled || loading}
        {...(props as React.ComponentPropsWithoutRef<typeof motion.button>)}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
