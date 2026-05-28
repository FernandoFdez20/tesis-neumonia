import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function StatCardSkeleton() {
  return (
    <Card size="sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="size-9 rounded-xl" />
      </CardHeader>
      <CardContent className="pb-5 pt-0 px-5">
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  )
}

export function QuickActionsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3 md:pb-4 flex flex-row items-center justify-between gap-4">
        <div>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3 pt-0 pb-5 px-5">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 flex-1 rounded-xl" />
      </CardContent>
    </Card>
  )
}

export function PriorityCasesSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-border/30 p-4 border-l-[3px]">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function RecentAttentionsSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Skeleton className="h-4 w-36 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3 w-16" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="rounded-xl border border-border/30 overflow-hidden">
          <div className="bg-muted/20 p-4">
            <div className="grid grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-3 w-full" />
              ))}
            </div>
          </div>
          {[1, 2, 3, 4].map((row) => (
            <div key={row} className="border-t border-border/30 p-4">
              <div className="grid grid-cols-6 gap-4">
                {[1, 2, 3, 4, 5, 6].map((col) => (
                  <Skeleton key={col} className="h-3 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2 pb-1">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-80" />
        <Skeleton className="h-4 w-96" />
      </div>
      <QuickActionsSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_360px] items-start">
        <RecentAttentionsSkeleton />
        <PriorityCasesSkeleton />
      </div>
    </div>
  )
}
