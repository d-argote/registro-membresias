export default function DashboardLoading() {
  return (
    <>
      {/* Header Skeleton */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse">
        <div className="space-y-2">
          <div className="h-10 bg-surface-container-high rounded-lg w-64"></div>
          <div className="h-5 bg-surface-container rounded-lg w-48"></div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 bg-surface-container-high rounded-xl w-36"></div>
          <div className="h-10 bg-primary/40 rounded-xl w-44"></div>
        </div>
      </header>

      {/* Quick Access Grid Skeleton */}
      <section className="bg-surface-container-low/30 p-1 rounded-2xl animate-pulse mt-6">
        <div className="h-32 bg-surface-container rounded-xl w-full"></div>
      </section>

      {/* KPI Row Skeleton */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className="h-32 bg-surface-container-highest rounded-2xl p-6 flex flex-col justify-between animate-pulse">
          <div className="h-5 bg-surface-container-high rounded w-24"></div>
          <div className="h-10 bg-surface-container-high rounded w-32 mt-4"></div>
        </div>
        <div className="h-32 bg-surface-container-low rounded-2xl p-6 flex flex-col justify-between animate-pulse">
          <div className="h-5 bg-surface-container-high rounded w-24"></div>
          <div className="h-10 bg-surface-container-high rounded w-32 mt-4"></div>
        </div>
        <div className="h-32 bg-surface-container-highest rounded-2xl p-6 flex flex-col justify-between animate-pulse">
          <div className="h-5 bg-surface-container-high rounded w-24"></div>
          <div className="h-10 bg-surface-container-high rounded w-32 mt-4"></div>
        </div>
      </section>

      {/* Alert Section Skeleton */}
      <section className="mt-8">
        <div className="h-8 bg-surface-container-high rounded w-48 mb-4 animate-pulse"></div>
        <div className="bg-surface-container-low rounded-2xl p-4 h-48 animate-pulse"></div>
      </section>

      {/* Charts Skeleton */}
      <section className="grid grid-cols-12 gap-8 mt-8 animate-pulse">
        <div className="col-span-12 md:col-span-8 bg-surface-container-lowest rounded-2xl h-64"></div>
        <div className="col-span-12 md:col-span-4 bg-surface-container-lowest rounded-2xl h-64"></div>
      </section>
    </>
  );
}
