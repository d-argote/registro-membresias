/**
 * Loading skeleton for KPI cards
 */
export function KpiCardSkeleton() {
  return (
    <div className="col-span-4 p-8 bg-surface-container-lowest rounded-xl flex flex-col justify-between h-48 animate-pulse">
      <div className="h-4 bg-outline-variant/20 rounded w-24 mb-4"></div>
      <div className="space-y-3">
        <div className="h-8 bg-outline-variant/20 rounded w-32"></div>
        <div className="h-3 bg-outline-variant/20 rounded w-24"></div>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the alerts section
 */
export function AlertsSectionSkeleton() {
  return (
    <section className="bg-tertiary-fixed p-8 rounded-xl shadow-sm space-y-6 animate-pulse">
      <div className="h-6 bg-on-tertiary-fixed/20 rounded w-64 mb-4"></div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/40 p-4 rounded-lg space-y-2">
            <div className="h-4 bg-on-tertiary-fixed/20 rounded w-40"></div>
            <div className="h-4 bg-on-tertiary-fixed/20 rounded w-32"></div>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Loading skeleton for the chart section
 */
export function ChartSkeletons() {
  return (
    <section className="grid grid-cols-12 gap-8">
      <div className="col-span-8 bg-surface-container-lowest p-8 rounded-xl h-96 animate-pulse">
        <div className="h-full bg-outline-variant/20 rounded"></div>
      </div>
      <div className="col-span-4 bg-surface-container-lowest p-8 rounded-xl h-96 animate-pulse">
        <div className="h-full bg-outline-variant/20 rounded"></div>
      </div>
    </section>
  );
}
