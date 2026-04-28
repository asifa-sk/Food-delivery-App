import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, Sparkles, X } from 'lucide-react';
import { RESTAURANT_NAV_ITEMS } from './restaurantNav';
import { readStoredJson } from '../../utils/storage';

export default function RestaurantShell({ title, eyebrow = 'Restaurant workspace', subtitle, actions, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = readStoredJson('user', {});

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
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-6">
            <div>
              <div className="hero-badge border-slate-300 bg-white text-slate-800">Foodyy Partner</div>
              <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-950">Restaurant Hub</h2>
              <p className="mt-1 text-sm font-medium text-slate-700">Operations, orders, menu and growth.</p>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="rounded-2xl border border-slate-200 p-2 text-slate-700 lg:hidden">
              <X size={18} />
            </button>
          </div>

          <nav className="space-y-2 px-4 py-6">
            {RESTAURANT_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-brand-500 text-white shadow-[0_18px_40px_rgba(255,107,44,0.24)]'
                      : 'text-slate-700 hover:bg-brand-500 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-slate-200 px-4 py-5">
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-sm font-black text-brand-700 shadow-sm">
                  {(user.name || 'R').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name || 'Restaurant Owner'}</p>
                  <p className="truncate text-xs font-medium text-slate-700">{user.email || 'Partner account'}</p>
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

        {sidebarOpen && <div className="fixed inset-0 z-40 bg-brand-500/25 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/70 bg-white/80 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-4">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-2xl border border-brand-200 bg-white p-2.5 text-brand-700 shadow-sm lg:hidden"
                >
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <div className="hero-badge hidden sm:inline-flex">
                    <Sparkles size={12} />
                    {eyebrow}
                  </div>
                  <h1 className="mt-0.5 truncate text-2xl font-black tracking-tight text-slate-950">{title}</h1>
                  {subtitle ? <p className="mt-1 truncate text-sm text-brand-700">{subtitle}</p> : null}
                </div>
              </div>
              {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
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
