import { SiteHeader } from "@/components/site-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function TargetLoading() {
  return (
    <>
      <SiteHeader />
      <main className="container py-8">
        <Skeleton className="mb-6 h-5 w-20" />
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="mb-8 h-[380px] rounded-xl" />
        <div className="mb-4 flex items-end justify-between gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-9 w-80" />
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
          ))}
        </div>
      </main>
    </>
  );
}
