import { SkeletonBoard } from "@/shared/ui/skeleton-board";

export default function Loading() {
  return (
    <main id="main-content" className="min-h-screen bg-surface p-5">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-5 h-24 animate-pulse rounded-xl border border-border bg-card" />
        <SkeletonBoard />
      </div>
    </main>
  );
}
