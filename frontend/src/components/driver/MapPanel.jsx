export default function MapPanel() {
  return (
    <div className="panel-dark flex h-96 flex-col rounded-[2rem] p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-semibold text-white">Live Map</div>
        <div className="text-xs uppercase tracking-[0.18em] text-brand-100">GPS Active</div>
      </div>
      <div className="relative flex flex-1 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/10">
        <img
          src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1200&q=80"
          alt="Delivery route planning"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,23,42,0.12),rgba(15,23,42,0.6))]" />
        <div className="absolute inset-x-4 bottom-4 rounded-[1.25rem] border border-white/15 bg-slate-950/45 px-4 py-3 backdrop-blur">
          <p className="text-sm font-semibold text-white">Delivery route overview</p>
          <p className="mt-1 text-xs leading-5 text-brand-100">Monitor pickups, drop-offs, and active handoffs from a cleaner visual panel.</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 text-xs text-brand-100">
        <div className="rounded-full bg-white/10 px-3 py-1.5">Zoom</div>
        <div className="rounded-full bg-white/10 px-3 py-1.5">Follow</div>
        <div className="rounded-full bg-white/10 px-3 py-1.5">My Location</div>
      </div>
    </div>
  );
}
