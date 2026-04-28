export default function LocationStatusBanner({ state, activeTripCount = 0 }) {
  if (!state || state.status === 'idle' || activeTripCount === 0) {
    return null;
  }

  const tone = state.status === 'active'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : state.status === 'requesting'
      ? 'border-amber-200 bg-amber-50 text-amber-800'
      : 'border-red-200 bg-red-50 text-red-800';

  const title = state.status === 'active'
    ? 'Live tracking is on'
    : state.status === 'requesting'
      ? 'Location access needed'
      : state.status === 'unsupported'
        ? 'Live tracking unavailable'
        : 'Customer tracking is blocked';

  const actionLabel = state.status === 'active'
    ? 'Refresh GPS'
    : state.status === 'blocked'
      ? 'Enable Location'
      : state.status === 'error'
        ? 'Retry Sync'
        : state.status === 'requesting'
          ? 'Enable Location'
          : '';

  return (
    <div className={`rounded-[1.5rem] border px-4 py-4 shadow-sm ${tone}`}>
      <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-1 text-sm">{state.message}</p>
        </div>
        <div className="flex items-center gap-3">
          {state.requestLocationAccess ? (
            <button
              type="button"
              onClick={state.requestLocationAccess}
              className="rounded-xl bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-white"
            >
              {actionLabel}
            </button>
          ) : null}
          <div className="text-xs font-semibold uppercase tracking-[0.18em]">
            {activeTripCount} active {activeTripCount === 1 ? 'trip' : 'trips'}
          </div>
        </div>
      </div>
    </div>
  );
}
