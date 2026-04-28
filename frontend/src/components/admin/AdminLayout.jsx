import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BellRing, Building2, ClipboardList, LogOut, MapPinned, Menu, ShieldCheck, Truck, X } from 'lucide-react';
import { useToast } from '../common/Toast';
import { onOrderNotification } from '../../utils/notificationService';
import { readStoredJson } from '../../utils/storage';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: ShieldCheck },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Building2 },
  { to: '/admin/drivers', label: 'Drivers', icon: Truck },
  { to: '/admin/orders', label: 'All Orders', icon: ClipboardList },
  { to: '/admin/delivery-tracking', label: 'Delivery Tracking', icon: MapPinned },
];

export default function AdminLayout({ children, title }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = readStoredJson('user', {});
  const { showToast } = useToast();

  useEffect(() => {
    const off = onOrderNotification((payload) => {
      const message = payload.eta
        ? `Order #${payload.orderId} is ${payload.status}. ETA ${new Date(payload.eta).toLocaleTimeString()}`
        : `Order #${payload.orderId} is ${payload.status}`;
      showToast(message, { type: 'info', duration: 5000 });
    });
    return off;
  }, [showToast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  return (
    <div className="app-shell">
      <div className="relative flex min-h-screen">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white text-slate-900 shadow-[0_24px_60px_rgba(15,23,42,0.08)] transition-transform duration-300 lg:static lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="border-b border-slate-200 px-6 py-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="hero-badge border-slate-300 bg-white text-slate-800">Foodyy Control</div>
                <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Admin Center</h2>
                <p className="mt-1 text-sm font-medium text-slate-700">Platform oversight with one unified view.</p>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="rounded-2xl border border-slate-200 p-2 text-slate-700 lg:hidden">
                <X size={18} />
              </button>
            </div>
          </div>

          <nav className="space-y-2 px-4 py-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? 'bg-brand-500 text-white shadow-[0_18px_40px_rgba(255,107,44,0.24)]'
                      : 'text-slate-700 hover:bg-brand-500 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto px-4 py-5">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-brand-700 shadow-sm">
                  {(user.name || 'A').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name || 'Admin'}</p>
                  <p className="truncate text-xs font-medium text-slate-700">{user.email || 'Control account'}</p>
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

        {sidebarOpen ? <div className="fixed inset-0 z-40 bg-brand-500/25 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} /> : null}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="rounded-2xl border border-brand-200 bg-white p-2.5 text-brand-700 shadow-sm lg:hidden">
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <div className="hero-badge hidden sm:inline-flex">Platform Management</div>
                  <h1 className="mt-0.5 truncate text-2xl font-black tracking-tight text-slate-950">{title}</h1>
                  <p className="mt-1 text-sm text-brand-700">Monitor operations, approvals and delivery performance.</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm sm:flex sm:items-center sm:gap-2">
                  <BellRing size={15} className="text-brand-500" />
                  Live operations
                </div>
                <button
                  onClick={handleLogout}
                  className="hidden rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 sm:inline-flex"
                >
                  Logout
                </button>
              </div>
            </div>
          </header>

          <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
