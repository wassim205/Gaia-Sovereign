'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ 
  children, 
  className, 
  hover = true, 
  onClick 
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'relative rounded-2xl overflow-hidden',
        'bg-white/3 backdrop-blur-xl',
        'border border-white/6',
        hover && 'hover:bg-white/6 hover:border-white/12 transition-all duration-500 cursor-pointer',
        className
      )}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/2 via-transparent to-transparent pointer-events-none" />
      <div className="relative">{children}</div>
    </motion.div>
  );
}
