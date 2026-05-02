import { Skeleton } from "@/components/ui/skeleton";

export function SurveyBuilderLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex h-14 items-center justify-between border-b border-primary/10 px-4">
        <Skeleton className="h-9 w-36" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="h-9 w-32" />
        </div>
      </header>
      <div className="flex h-[calc(100vh-56px)]">
        <aside className="w-[320px] shrink-0 border-r border-primary/10 bg-card/30 p-4">
          <Skeleton className="h-8 w-40" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`skeleton-section-${i}`} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </aside>
        <main className="min-w-0 flex-1 border-r border-primary/10 p-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-3 h-4 w-72" />
          <div className="mt-6 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={`skeleton-card-${i}`} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        </main>
        <section className="w-[360px] shrink-0 p-4">
          <Skeleton className="h-full min-h-56 w-full rounded-xl" />
        </section>
      </div>
    </div>
  );
}
