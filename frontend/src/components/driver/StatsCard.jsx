export default function StatsCard({ title, value, subtitle, accent = 'blue' }) {
  const accentClasses = {
    blue: 'from-brand-400 to-brand-500 text-white',
    orange: 'from-brand-500 to-brand-400 text-white',
  };

  return (
    <div className="metric-card overflow-hidden">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-600">{title}</p>
          <p className="mt-4 text-4xl font-black tracking-tight text-slate-950">{value ?? '-'}</p>
          {subtitle ? <p className="mt-2 text-sm text-slate-500">{subtitle}</p> : null}
        </div>
        <div className={`rounded-2xl bg-gradient-to-br px-3 py-6 text-xs font-bold ${accentClasses[accent] || accentClasses.blue}`}>
          Live
        </div>
      </div>
    </div>
  );
}
