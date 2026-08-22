export default function DashboardLoading() {
  return <div className="space-y-4" role="status" aria-label="正在加载页面">
    <div className="skeleton h-7 w-40" />
    <div className="skeleton h-4 w-72 max-w-full" />
    <div className="grid grid-cols-2 gap-3 pt-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => <div key={index} className="panel h-28 p-4"><div className="skeleton h-3 w-20" /><div className="skeleton mt-5 h-7 w-14" /><div className="skeleton mt-3 h-3 w-24" /></div>)}
    </div>
    <div className="panel overflow-hidden">
      <div className="border-b border-[var(--border)] p-4"><div className="skeleton h-9 w-full max-w-md" /></div>
      {Array.from({ length: 7 }, (_, index) => <div key={index} className="flex h-12 items-center gap-5 border-b border-[var(--border)] px-4 last:border-0"><div className="skeleton h-3 w-16" /><div className="skeleton h-3 w-32" /><div className="skeleton h-3 flex-1" /></div>)}
    </div>
    <span className="sr-only">页面内容加载中</span>
  </div>;
}
