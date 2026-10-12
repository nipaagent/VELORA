import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-slate-200/80 dark:bg-slate-800/80 skeleton-shimmer overflow-hidden",
        className
      )}
    />
  );
}

// KPI Dashboard Card Skeleton (6-grid)
export function KpiCardSkeleton() {
  return (
    <div className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-6 w-6 rounded-lg" />
      </div>
      <Skeleton className="h-7 w-24 rounded-lg" />
      <Skeleton className="h-2.5 w-20" />
    </div>
  );
}

// Admin Table Row Skeleton
export function TableRowSkeleton() {
  return (
    <div className="p-3 bg-white rounded-2xl border border-slate-100 flex items-center justify-between gap-3 my-2">
      <div className="flex items-center gap-3">
        <Skeleton className="w-9 h-9 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-2.5 w-40" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-xl" />
      </div>
    </div>
  );
}

// Chat History Loading Skeleton
export function ChatMessageSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={cn("flex w-full my-3", isUser ? "justify-end" : "justify-start")}>
      <div className="flex gap-3 max-w-[80%] items-start">
        {!isUser && <Skeleton className="w-7 h-7 rounded-full shrink-0" />}
        <div className={cn("p-4 rounded-2xl space-y-2 w-64", isUser ? "bg-slate-900/10" : "bg-white border border-slate-200/90")}>
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}

// Sidebar Chat Item Skeleton
export function SidebarItemSkeleton() {
  return (
    <div className="px-3 py-2.5 rounded-xl flex items-center gap-2.5 my-1">
      <Skeleton className="w-4 h-4 rounded shrink-0" />
      <Skeleton className="h-3.5 flex-1" />
    </div>
  );
}
