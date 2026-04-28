import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RadioTower, Route, Truck } from 'lucide-react';

export default function DriverTopbar({ driverName }) {
  const [online, setOnline] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('driver');
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <div className="hero-badge hidden sm:inline-flex">
            <Truck size={12} />
            Driver workspace
          </div>
          <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950">Welcome, {driverName}</h1>
          <p className="mt-1 text-sm font-medium text-slate-700">Stay synced with active trips, available orders and delivery progress.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm sm:flex">
            <Route size={15} className="text-brand-500" />
            Mode: Delivery
          </div>
          <button
            onClick={() => setOnline((value) => !value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
              online ? 'bg-brand-100 text-brand-700' : 'bg-brand-200 text-brand-800'
            }`}
          >
            <RadioTower size={15} />
            {online ? 'Online' : 'Offline'}
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
