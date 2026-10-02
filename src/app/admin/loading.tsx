export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-slate-800 rounded-lg" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800/60 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-800 rounded" />
              </div>
              <div className="h-8 w-20 bg-slate-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
