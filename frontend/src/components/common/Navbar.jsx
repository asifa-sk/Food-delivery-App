import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-400 text-lg font-black text-white shadow-glow">
            F
          </div>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-950">Foodyy</p>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Curated delivery</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden rounded-full border border-brand-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm sm:inline-flex">
                Hi, {user.name}
              </span>
              <Link to="/orders" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700">
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700">
                Login
              </Link>
              <Link to="/register" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700">
                Sign Up
              </Link>
              <Link to="/driver/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-brand-50 hover:text-brand-700 md:inline-flex">
                Driver Login
              </Link>
              <Link to="/driver/signup" className="rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400">
                Driver Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
