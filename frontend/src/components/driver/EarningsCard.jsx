export default function EarningsCard({
  todayEarnings = 0,
  weekEarnings = 0,
  tripCount = 0,
  deliveredCount = 0,
}) {
  return (
    <div className="metric-card overflow-hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">Today's Earnings</div>
          <div className="mt-3 text-3xl font-black text-slate-950">Rs. {Number(todayEarnings).toFixed(2)}</div>
        </div>
        <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm text-slate-600">
          Week: <span className="font-semibold text-slate-900">Rs. {Number(weekEarnings).toFixed(2)}</span>
        </div>
      </div>
      <div className="mt-4 text-sm text-slate-500">
        Trips: <span className="font-semibold text-slate-800">{tripCount}</span> • Delivered: <span className="font-semibold text-slate-800">{deliveredCount}</span>
      </div>
    </div>
  );
}
