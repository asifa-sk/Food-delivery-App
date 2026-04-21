import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, ChevronDown, User, Package, Heart, Tag, LogOut, Home } from "lucide-react";
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
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-0">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <Link to={homeRoute} className="flex items-center gap-1 flex-shrink-0">
            <span className="text-2xl">🍽️</span>
            <span className="text-2xl font-black text-orange-500 tracking-tight">foodyy</span>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1 ml-auto">
            <Link to={homeRoute} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition">
              <Home size={16} /> Home
            </Link>
            <Link to="/offers" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition">
              <Tag size={16} /> Offers
            </Link>
          </div>

          {/* Cart */}
          <button
            onClick={() => navigate("/cart")}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100 transition font-semibold text-sm"
          >
            <ShoppingCart size={18} />
            <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>

          {/* Profile */}
          {user ? (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 transition"
              >
                <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {initials}
                </div>
                <ChevronDown size={16} className={"text-gray-500 transition " + (profileOpen ? "rotate-180" : "")} />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 mb-1">
                    <p className="font-bold text-gray-800 text-sm">{displayName}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  <button onClick={() => { setProfileOpen(false); navigate("/profile"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                    <User size={15} /> My Profile
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/orders"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                    <Package size={15} /> My Orders
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/favorites"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                    <Heart size={15} /> Favorites
                  </button>
                  <button onClick={() => { setProfileOpen(false); navigate("/offers"); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition">
                    <Tag size={15} /> Offers
                  </button>
                  <div className="border-t border-gray-100 mt-1 pt-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
