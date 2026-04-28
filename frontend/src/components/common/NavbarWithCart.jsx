import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ChevronDown, User, Package, Heart, Tag, LogOut, Home, Sparkles } from "lucide-react";
import Notifications from './Notifications';
import { useCart } from "../../context/CartContext";
import { getHomeRouteForRole } from "../../utils/roleUtils";

export default function NavbarWithCart({ user, onLogout }) {
  const navigate = useNavigate();
  const { cartCount } = useCart();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const homeRoute = getHomeRouteForRole(user?.role);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    onLogout();
    navigate("/login");
  };

  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-100/80 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Link to={homeRoute} className="flex shrink-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 via-brand-500 to-accent-500 text-lg font-black text-white shadow-glow">
              F
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-ink-950">Foodyy</p>
              <p className="text-xs uppercase tracking-[0.24em] text-ink-400">Premium delivery</p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-brand-100 bg-surface-50 px-4 py-2 text-sm font-semibold text-ink-600 shadow-soft lg:flex">
            <Sparkles size={15} className="text-brand-500" />
            Tastefully fast
          </div>

          <div className="hidden md:ml-auto md:flex md:items-center md:gap-1">
            <Link to={homeRoute} className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700">
              <Home size={16} /> Home
            </Link>
            <Link to="/offers" className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-ink-600 transition hover:bg-brand-50 hover:text-brand-700">
              <Tag size={16} /> Offers
            </Link>
          </div>

          <button
            onClick={() => navigate("/cart")}
            className="relative ml-auto inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-float transition hover:bg-brand-400 md:ml-0"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[11px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>

          <div className="relative">
            <Notifications user={user} />
          </div>

          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-ink-200 bg-white px-2.5 py-2 text-sm font-semibold text-ink-700 shadow-soft transition hover:border-brand-200 hover:bg-brand-50"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-sm font-black text-white">
                  {initials}
                </div>
                <span className="hidden max-w-[110px] truncate md:block">{displayName}</span>
                <ChevronDown size={16} className={`text-ink-400 transition ${profileOpen ? "rotate-180" : ""}`} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-[24px] border border-brand-100 bg-white/95 py-2 shadow-float backdrop-blur-xl">
                  <div className="border-b border-ink-100 px-4 py-3">
                    <p className="font-bold text-ink-900">{displayName}</p>
                    <p className="truncate text-xs text-ink-500">{user.email}</p>
                  </div>
                  <button onClick={() => { setProfileOpen(false); navigate("/profile"); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700">
                    <User size={15} /> My Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/orders"); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700">
                    <Package size={15} /> My Orders
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/favorites"); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700">
                    <Heart size={15} /> Favorites
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/offers"); }} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink-700 transition hover:bg-brand-50 hover:text-brand-700">
                    <Tag size={15} /> Offers
                  </button>
                  <div className="mt-1 border-t border-ink-100 pt-1">
                    <button onClick={handleLogout} className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 transition hover:bg-red-50">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="rounded-full bg-brand-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
