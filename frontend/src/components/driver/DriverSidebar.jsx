import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, LogOut, Package, Settings, User } from 'lucide-react';
import { readStoredJson } from '../../utils/storage';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/driver/dashboard', icon: Home },
  { name: 'My Orders', path: '/driver/orders', icon: Package },
  { name: 'Profile', path: '/driver/profile', icon: User },
  { name: 'Settings', path: '/driver/settings', icon: Settings },
];

export default function DriverSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const driver = readStoredJson('driver', {});

  const handleLogout = () => {
    localStorage.removeItem('driver');
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.08)] lg:flex lg:flex-col">
      <div className="border-b border-slate-200 px-6 py-6">
        <div className="hero-badge border-slate-300 bg-white text-slate-800">Foodyy Fleet</div>
        <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Driver Desk</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">Dispatch, earnings and trip control.</p>
      </div>

      <nav className="space-y-2 px-4 py-6">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-brand-500 text-white shadow-[0_18px_40px_rgba(255,107,44,0.24)]'
                  : 'text-slate-700 hover:bg-brand-500 hover:text-white'
              }`}
            >
              <Icon size={18} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 py-5">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-brand-700 shadow-sm">
              {(driver?.name || 'D').slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{driver?.name || 'Driver'}</p>
              <p className="truncate text-xs font-medium text-slate-700">{driver?.email || 'Fleet member'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-500 hover:bg-brand-500 hover:text-white"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
