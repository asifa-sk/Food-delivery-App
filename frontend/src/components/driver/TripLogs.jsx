import { formatOrderCurrency, formatOrderDateTime } from '../../utils/orderUtils';

function statusTone(status) {
  switch (status) {
    case 'DELIVERED':
      return 'bg-success-50 text-success-700';
    case 'NEARBY':
      return 'bg-orange-100 text-orange-700';
    case 'OUT_FOR_DELIVERY':
      return 'bg-brand-100 text-brand-700';
    case 'PICKED_UP':
      return 'bg-blue-100 text-blue-700';
    case 'ARRIVED_AT_RESTAURANT':
      return 'bg-cyan-100 text-cyan-700';
    case 'ACCEPTED_BY_DRIVER':
    case 'DRIVER_ASSIGNED':
      return 'bg-brand-50 text-brand-700';
    default:
      return 'bg-surface-50 text-slate-700';
  }
}

export default function TripLogs({
  loading = false,
  trips = [],
  onAccept,
  onStatusChange,
  actionLoading = null,
  title = 'Trip Logs',
  subtitle = 'Recent',
  emptyLabel = 'No trips yet',
}) {
  return (
    <div className="panel-surface rounded-[2rem] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        <div className="text-xs uppercase tracking-[0.18em] text-brand-600">{subtitle}</div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-slate-500">Loading...</div>
      ) : trips.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-brand-200 bg-brand-50 px-4 py-8 text-center text-sm text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <ul className="max-h-[28rem] space-y-3 overflow-auto pr-1">
          {trips.map((trip) => (
            <li key={trip.id} className="rounded-[1.5rem] border border-brand-100 bg-surface-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-900">Order {trip.displayId || `#${trip.id}`}</div>
                  <div className="mt-1 text-xs text-slate-500">{trip.restaurant?.name || 'Restaurant'}</div>
                  <div className="mt-2">
                    <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${statusTone(trip.status)}`}>
                      {trip.statusLabel || trip.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-slate-500">{trip.customerName || 'Customer'}</div>
                  {trip.deliveryAddress && (
                    <div className="mt-1 truncate text-xs text-slate-500">{trip.deliveryAddress}</div>
                  )}
                  {(trip.createdAt || trip.deliveredAt) && (
                    <div className="mt-1 text-xs text-slate-500">
                      {trip.deliveredAt
                        ? `Delivered: ${formatOrderDateTime(trip.deliveredAt)}`
                        : `Placed: ${formatOrderDateTime(trip.createdAt)}`}
                    </div>
                  )}
                </div>

                <div className="shrink-0">
                  <div className="text-right text-sm font-semibold text-slate-900">{formatOrderCurrency(trip.totalPrice)}</div>
                  <div className="mt-2 flex flex-wrap justify-end gap-2">
                    {onAccept && !trip.accepted && (
                      <button
                        onClick={() => onAccept(trip.id)}
                        disabled={actionLoading === trip.id}
                        className="rounded-xl bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
                      >
                        {actionLoading === trip.id ? '...' : 'Accept'}
                      </button>
                    )}
                    {onStatusChange && ['ACCEPTED_BY_DRIVER', 'DRIVER_ASSIGNED'].includes(trip.status) && (
                      <button
                        onClick={() => onStatusChange(trip.id, 'OUT_FOR_DELIVERY')}
                        disabled={actionLoading === trip.id}
                        className="rounded-xl bg-blue-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-60"
                      >
                        {actionLoading === trip.id ? '...' : 'Picked Up'}
                      </button>
                    )}
                    {onStatusChange && trip.status === 'OUT_FOR_DELIVERY' && (
                      <button
                        onClick={() => onStatusChange(trip.id, 'DELIVERED')}
                        disabled={actionLoading === trip.id}
                        className="rounded-xl bg-success-700 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-success-800 disabled:opacity-60"
                      >
                        {actionLoading === trip.id ? '...' : 'Mark Delivered'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
