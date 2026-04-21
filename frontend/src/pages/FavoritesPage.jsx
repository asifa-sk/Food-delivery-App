import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, ChevronLeft, Star, Clock, Trash2 } from "lucide-react";
import { useToast } from "../components/common/Toast";
import NavbarWithCart from "../components/common/NavbarWithCart";
import CartSidebar from "../components/common/CartSidebar";
import { useAuth } from "../hooks/useAuth";

const API = "http://localhost:8081/api";

export default function FavoritesPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteRestaurants");
    if (saved) {
      try { setFavoriteIds(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (user && user.id) {
        try {
          const { getUserFavorites } = await import('../api/favoriteApi');
          const favs = await getUserFavorites(user.id);
          setAllRestaurants(Array.isArray(favs) ? favs : []);
          setFavoriteIds(Array.isArray(favs) ? favs.map((r) => r.id) : []);
          localStorage.setItem('favoriteRestaurants', JSON.stringify(Array.isArray(favs) ? favs.map((r) => r.id) : []));
          setLoading(false);
          return;
        } catch (e) {
          console.debug('favorite fetch failed', e?.message || e);
        }
      }

      fetch(`${API}/restaurants`)
        .then((res) => res.json())
        .then((data) => setAllRestaurants(Array.isArray(data) ? data : []))
        .catch(() => setAllRestaurants([]))
        .finally(() => setLoading(false));
    };

    load();
  }, []);

  const removeFavorite = (id) => {
    const updated = favoriteIds.filter((fid) => String(fid) !== String(id));
    setFavoriteIds(updated);
    localStorage.setItem("favoriteRestaurants", JSON.stringify(updated));
    if (user && user.id) {
      import('../api/favoriteApi').then(({ removeFavorite }) => removeFavorite(user.id, id).catch(() => {}));
    }
    if (typeof showToast === 'function') showToast('Removed from favorites', { type: 'success' });
  };

  const favoriteRestaurants = allRestaurants.filter((r) =>
    favoriteIds.some((fid) => String(fid) === String(r.id))
  );

  // load favorite items (food items) from localStorage
  const [favoriteItems, setFavoriteItems] = useState([]);
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('favoriteItems') || '[]');
      if (Array.isArray(stored)) setFavoriteItems(stored);
    } catch (e) {}
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/home")} className="p-2 rounded-xl hover:bg-gray-200 transition text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Favorites</h1>
            <p className="text-sm text-gray-500">Restaurants you have saved</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24">
            <div className="w-8 h-8 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading your favorites...</p>
          </div>
        ) : favoriteRestaurants.length === 0 ? (
          <>
            <div>
              {favoriteItems.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">Favorite Items</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {favoriteItems.map((it) => (
                      <div key={it.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-3">
                        {it.imageUrl ? (
                          <img src={it.imageUrl} alt={it.name} className="w-20 h-20 rounded-lg object-cover" />
                        ) : (
                          <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center">🍽️</div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-900">{it.name}</div>
                          <div className="text-xs text-gray-500">{it.restaurantName}</div>
                          <div className="text-sm text-orange-600 font-bold mt-1">Rs. {it.price}</div>
                        </div>
                        <button onClick={() => { setFavoriteItems(prev => { const upd = prev.filter(p => String(p.id)!==String(it.id)); localStorage.setItem('favoriteItems', JSON.stringify(upd)); return upd; }) ; if (typeof showToast==='function') showToast('Removed item from favorites',{type:'success'}) }} className="ml-auto text-red-500">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="text-center py-24">
              <Heart className="mx-auto mb-4 text-gray-300" size={64} />
              <p className="text-xl font-bold text-gray-700">No favorites yet</p>
              <p className="text-gray-500 mt-1">Tap the heart on any restaurant to save it here</p>
              <button onClick={() => navigate("/home")} className="mt-5 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl transition">
                Explore Restaurants
              </button>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {favoriteRestaurants.map((r) => (
              <div
                key={r.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group cursor-pointer"
                onClick={() => navigate("/menu/" + r.id)}
              >
                <div className="relative h-36 bg-gradient-to-br from-orange-100 to-amber-200 flex items-center justify-center overflow-hidden">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { e.target.style.display = "none"; }} />
                  ) : (
                    <span className="text-6xl group-hover:scale-110 transition-transform">🍽️</span>
                  )}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-lg shadow">
                    <Star size={10} fill="currentColor" className="text-green-600" /> {Number(r.rating ?? 0).toFixed(1)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeFavorite(r.id); }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow hover:bg-red-600 transition"
                    title="Remove from favorites"
                  >
                    <Trash2 size={14} />
                  </button>
                  {!r.active && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="bg-black/70 text-white text-xs font-bold px-3 py-1 rounded-full">Currently Closed</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition">{r.name}</h3>
                  {r.cuisineType && (
                    <p className="text-orange-500 text-xs font-semibold mt-0.5">{r.cuisineType}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1 truncate">{r.address}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                    <Clock size={11} /> 30-45 min
                    {r.contactNumber && <><span>|</span> {r.contactNumber}</>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}