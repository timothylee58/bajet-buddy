"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-neutral-light",
        className
      )}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("animate-pulse rounded-2xl bg-neutral-light", className)} />
  );
}

export function SkeletonText({ lines = 2, className }: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg bg-neutral-light h-4"
          style={{ width: i === lines - 1 && lines > 1 ? "60%" : "100%" }}
        />
      ))}
    </div>
  );
}
