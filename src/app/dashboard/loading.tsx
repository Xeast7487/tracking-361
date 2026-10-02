export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-5 space-y-3">
            <div className="h-4 w-24 bg-slate-800 rounded" />
            <div className="h-8 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>
      <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-6 space-y-4">
        <div className="h-5 w-32 bg-slate-800 rounded" />
        <div className="h-24 bg-slate-800 rounded-lg" />
        <div className="h-10 w-full bg-slate-800 rounded-lg" />
      </div>
    </div>
  )
}
