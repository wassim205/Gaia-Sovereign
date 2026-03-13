'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'default' | 'stat' | 'vault' | 'token' | 'action';
  count?: number;
}

// Base skeleton with shimmer effect
function SkeletonBase({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden bg-white/5 rounded-xl', className)}>
      <motion.div
        className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Stat Card Skeleton
export function StatCardSkeleton() {
  return (
    <div className="p-5 bg-white/3 backdrop-blur-xl border border-white/6 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <SkeletonBase className="w-10 h-10 rounded-xl" />
        <SkeletonBase className="w-12 h-5 rounded-lg" />
      </div>
      <SkeletonBase className="w-20 h-8 rounded-lg mb-2" />
      <SkeletonBase className="w-24 h-4 rounded" />
    </div>
  );
}

// Vault Item Skeleton
export function VaultItemSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border bg-white/2 border-white/5">
      <SkeletonBase className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <SkeletonBase className="w-20 h-3 rounded" />
        <SkeletonBase className="w-32 h-4 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <SkeletonBase className="w-8 h-8 rounded-lg" />
        <SkeletonBase className="w-8 h-8 rounded-lg" />
      </div>
    </div>
  );
}

// Token Card Skeleton
export function TokenCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
      <div className="flex items-center gap-3 flex-1">
        <SkeletonBase className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="w-24 h-4 rounded" />
          <SkeletonBase className="w-32 h-3 rounded" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <SkeletonBase className="w-16 h-3 rounded ml-auto" />
        <SkeletonBase className="w-12 h-3 rounded ml-auto" />
      </div>
    </div>
  );
}

// Action Button Skeleton
export function ActionButtonSkeleton() {
  return (
    <div className="flex items-center gap-2.5 p-3 rounded-xl bg-white/2 border border-white/5">
      <SkeletonBase className="w-8 h-8 rounded-lg shrink-0" />
      <SkeletonBase className="w-16 h-4 rounded" />
    </div>
  );
}

// Recent Access Item Skeleton
export function RecentAccessSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-white/2 border border-white/5">
      <div className="flex items-center gap-3 flex-1">
        <SkeletonBase className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <SkeletonBase className="w-28 h-4 rounded" />
          <SkeletonBase className="w-40 h-3 rounded" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <SkeletonBase className="w-16 h-3 rounded" />
        <SkeletonBase className="w-12 h-5 rounded-lg" />
      </div>
    </div>
  );
}

// Generic Loading Skeleton with variant support
export default function LoadingSkeleton({ className, variant = 'default', count = 1 }: LoadingSkeletonProps) {
  const components = {
    default: SkeletonBase,
    stat: StatCardSkeleton,
    vault: VaultItemSkeleton,
    token: TokenCardSkeleton,
    action: ActionButtonSkeleton,
  };

  const Component = components[variant] || SkeletonBase;

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Component key={i} className={className} />
      ))}
    </>
  );
}
