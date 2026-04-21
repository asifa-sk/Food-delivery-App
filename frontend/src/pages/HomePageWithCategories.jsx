import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Star, Clock, ChevronRight, TrendingUp, Zap, Award, PercentSquare } from "lucide-react";
import NavbarWithCart from "../components/common/NavbarWithCart";
import CartSidebar from "../components/common/CartSidebar";
import FoodItemCard from '../components/FoodItemCard';
import { useAuth } from "../hooks/useAuth";
import { useToast } from '../components/common/Toast';

const CUISINE_CATEGORIES = [
  { id: "all", label: "All", image: "https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "burger", label: "Burger", image: "https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "biryani", label: "Biryani", image: "https://images.pexels.com/photos/12737816/pexels-photo-12737816.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "pizza", label: "Pizza", image: "https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "momos", label: "Momos", image: "https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "chinese", label: "Chinese", image: "https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "south-indian", label: "South Indian", image: "https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
  { id: "desserts", label: "Desserts", image: "https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=200&h=200&fit=crop" },
];

const RESTAURANTS = [];

const API = 'http://localhost:8081/api';

const OFFER_BANNERS = [
  { id: 1, title: "Flat 40% OFF", subtitle: "on all burger restaurants above ₹399", code: "BURGER40", gradient: "from-orange-500 to-red-500", emoji: "🍔" },
  { id: 2, title: "Buy 1 Get 1 FREE", subtitle: "on dessert combos above ₹299", code: "SWEETBOGO", gradient: "from-pink-500 to-purple-500", emoji: "🍰" },
  { id: 3, title: "Free Delivery", subtitle: "on your first 3 orders above ₹199", code: "FREEDEL3", gradient: "from-green-500 to-teal-500", emoji: "🛵" },
];

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "top-rated", label: "Top Rated" },
  { id: "fast-delivery", label: "Fast Delivery" },
  { id: "with-offers", label: "With Offers" },
  { id: "new", label: "New" },
  { id: "pure-veg", label: "Pure Veg" },
];

export default function HomePageWithCategories() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [favoriteRestaurants, setFavoriteRestaurants] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [allFoods, setAllFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("favoriteRestaurants");
    if (saved) {
      try { setFavoriteRestaurants(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // if user is logged in, sync favorites from server
  useEffect(() => {
    const syncFromServer = async () => {
      if (!user || !user.id) return;
      try {
        const { getUserFavorites } = await import('../api/favoriteApi');
        const favs = await getUserFavorites(user.id);
        const ids = Array.isArray(favs) ? favs.map((r) => r.id) : [];
        setFavoriteRestaurants(ids);
        localStorage.setItem('favoriteRestaurants', JSON.stringify(ids));
      } catch (e) {
        // ignore network errors and keep client-side list
        console.debug('favorites sync failed', e?.message || e);
      }
    };
    syncFromServer();
  }, [user]);

  useEffect(() => {
    fetch(`${API}/restaurants`)
      .then((res) => res.json())
      .then((data) => {
        const CUISINE_MAP = {
          burger: ['Burger', 'Gourmet', 'Fast Food'],
          biryani: ['Biryani', 'Mughlai', 'Rice'],
          pizza: ['Pizza', 'Italian', 'Pasta'],
          momos: ['Momos', 'Tibetan', 'Dumplings'],
          chinese: ['Chinese', 'Asian', 'Noodles'],
          'south-indian': ['South Indian', 'Idli', 'Dosa'],
          desserts: ['Desserts', 'Cakes', 'Ice Cream', 'Sweets'],
        };
        const mapped = data.map((r) => {
          const ct = (r.cuisineType || '').toLowerCase().replace(/\s+/g, '-');
          const category = CUISINE_MAP[ct] ? ct : 'all';
          const cuisines = CUISINE_MAP[ct] || (r.cuisineType ? [r.cuisineType] : []);
          // deterministic pseudo-random values based on id to make demo consistent
          const seed = Number(r.id) || 1;
          const eta = 20 + (seed * 13) % 31; // 20-50 range
          const hasDiscount = (seed % 5) === 0; // ~20% have discounts
          const discount = hasDiscount ? { percent: 10 + (seed % 30) } : null;
          const isNew = (seed % 7) === 0; // some new restaurants
          const isPureVeg = (r.cuisineType || '').toLowerCase().includes('veg') || (r.name || '').toLowerCase().includes('veg');
          return {
            id: r.id,
            name: r.name,
            cuisines,
            rating: r.rating ?? 0,
            reviewCount: 0,
            eta: eta,
            costForTwo: 0,
            image: r.imageUrl || null,
            discount: discount,
            isOpen: r.active,
            category,
            isNew: isNew,
            isPureVeg: isPureVeg,
          };
        });
        setRestaurants(mapped);
      })
      .catch(() => setRestaurants([]));
  }, []);

  const toggleFavorite = (restaurantId) => {
    const prev = favoriteRestaurants;
    const added = !prev.includes(restaurantId);
    const updated = added ? [...prev, restaurantId] : prev.filter((id) => id !== restaurantId);
    setFavoriteRestaurants(updated);
    localStorage.setItem('favoriteRestaurants', JSON.stringify(updated));

    if (user && user.id) {
      import('../api/favoriteApi').then(({ addFavorite, removeFavorite }) => {
        if (added) addFavorite(user.id, restaurantId).catch(() => {});
        else removeFavorite(user.id, restaurantId).catch(() => {});
      });
    }

    if (typeof showToast === 'function') showToast(added ? 'Added to favorites' : 'Removed from favorites', { type: 'success' });
    return updated;
  };

  const filteredRestaurants = useMemo(() => {
    let list = [...restaurants];
    if (activeCategory !== "all") list = list.filter((r) => r.category === activeCategory);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q) || r.cuisines.some((c) => c.toLowerCase().includes(q)));
    }
    if (activeFilter === "top-rated") list = list.filter((r) => r.rating >= 4.5);
    if (activeFilter === "fast-delivery") list = list.filter((r) => parseInt(r.eta) <= 25);
    if (activeFilter === "with-offers") list = list.filter((r) => r.discount);
    if (activeFilter === "new") list = list.filter((r) => r.isNew);
    if (activeFilter === "pure-veg") list = list.filter((r) => r.isPureVeg);
    return list;
  }, [activeCategory, activeFilter, searchQuery, restaurants]);

  const matchedDishes = useMemo(() => {
    if (!searchQuery.trim() || allFoods.length === 0) return [];
    const q = searchQuery.toLowerCase();
    return allFoods.filter((f) => {
      return (
        (f.name || '').toLowerCase().includes(q) ||
        (f.description || '').toLowerCase().includes(q) ||
        (f.category || '').toLowerCase().includes(q) ||
        (f.restaurantName || '').toLowerCase().includes(q)
      );
    }).slice(0, 12);
  }, [searchQuery, allFoods]);

  // Fetch foods for restaurants once when a search is made (lazy-load)
  useEffect(() => {
    if (!searchQuery.trim() || restaurants.length === 0 || allFoods.length > 0) return;
    setFoodsLoading(true);
    Promise.all(
      restaurants.map((r) =>
        fetch(`${API}/food/restaurant/${r.id}`)
          .then((res) => res.json())
          .then((items) => (Array.isArray(items) ? items.map((it) => ({ ...it, restaurantId: r.id, restaurantName: r.name })) : []))
          .catch(() => [])
      )
    )
      .then((arr) => {
        const flat = arr.flat();
        setAllFoods(flat);
      })
      .finally(() => setFoodsLoading(false));
  }, [searchQuery, restaurants, allFoods.length]);

  const topRestaurants = useMemo(() => restaurants.filter((r) => r.isOpen).slice(0, 6), [restaurants]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-12 text-8xl">🍕</div>
          <div className="absolute bottom-4 right-48 text-6xl">🍔</div>
          <div className="absolute top-8 right-80 text-5xl">🥟</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 relative">
          <div className="max-w-2xl">
            <p className="text-orange-100 text-sm font-semibold tracking-widest uppercase mb-2">Foodyy • Delivery in 30 minutes</p>
            <h1 className="text-4xl md:text-5xl font-black mb-2 leading-tight">
              Hungry? We have got<br />you covered! 🍽️
            </h1>
            <p className="text-orange-100 text-lg mb-8">Order from {restaurants.length} restaurant{restaurants.length !== 1 ? "s" : ""}. Fresh food, fast delivery.</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                type="text"
                placeholder="Search for restaurants, cuisines or dishes..."
                className="w-full pl-12 pr-4 py-4 rounded-2xl text-gray-800 bg-white shadow-xl focus:outline-none focus:ring-4 focus:ring-orange-200 text-base"
              />
            </div>
          </div>
        </div>
        <div className="h-8 bg-gray-50" style={{clipPath: "ellipse(55% 100% at 50% 100%)"}} />
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {/* Category chips removed per request (non-working) */}

        {/* Offer Banners */}
        <section className="pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Best Deals</h2>
            <button onClick={() => navigate("/offers")} className="text-orange-500 text-sm font-semibold flex items-center gap-1 hover:underline">
              See all <ChevronRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {OFFER_BANNERS.map((offer) => (
              <div
                key={offer.id}
                className={"bg-gradient-to-r " + offer.gradient + " text-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:scale-105 transition-transform shadow-md"}
                onClick={() => navigate("/offers")}
              >
                <span className="text-4xl">{offer.emoji}</span>
                <div>
                  <p className="font-black text-xl">{offer.title}</p>
                  <p className="text-white/80 text-xs mt-0.5">{offer.subtitle}</p>
                  <span className="mt-2 inline-block bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold">{offer.code}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Picks */}
        {activeCategory === "all" && !searchQuery && (
          <section className="pb-10">
            <div className="flex items-center gap-2 mb-4">
              <Award size={20} className="text-orange-500" />
              <h2 className="text-lg font-bold text-gray-800">Top Picks for You</h2>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
              {topRestaurants.map((r) => (
                <button
                  key={r.id}
                  onClick={() => navigate("/menu/" + r.id)}
                  className="rounded-2xl overflow-hidden hover:scale-105 transition-transform shadow-sm border border-white/50 text-center bg-white"
                >
                  <div className="h-20 w-full overflow-hidden">
                    {r.image ? (
                      <img src={r.image} alt={r.name} className="h-full w-full object-cover" loading="lazy" onError={(e) => { e.target.style.display='none'; }} />
                    ) : (
                      <RestaurantPlaceholder name={r.name} />
                    )}
                  </div>
                  <div className="p-2 flex flex-col items-center gap-1.5">
                    <p className="font-bold text-gray-800 text-xs leading-tight line-clamp-2">{r.name}</p>
                    <span className="inline-flex items-center gap-0.5 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      <Star size={9} fill="currentColor" /> {r.rating}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTER_OPTIONS.map((f) => (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={"flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-all " + (activeFilter === f.id ? "bg-gray-800 text-white border-gray-800" : "bg-white text-gray-700 border-gray-200 hover:border-gray-400")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </section>

        {/* Dish results (when searching) */}
        {searchQuery.trim() && (
          <section className="pb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Dishes matching "{searchQuery}"</h2>
            {foodsLoading ? (
              <div className="text-center py-10 text-gray-500">Searching menus...</div>
            ) : matchedDishes.length === 0 ? (
              <div className="text-center py-6 text-gray-500 text-sm">No matching dishes found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {matchedDishes.map((dish) => (
                  <div key={dish.id} className="bg-white rounded-2xl p-4 shadow-sm">
                    <FoodItemCard item={dish} />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Restaurant Grid */}
        <section className="pb-16">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            {activeCategory === "all" ? "All Restaurants" : CUISINE_CATEGORIES.find((c) => c.id === activeCategory)?.label + " Restaurants"}
            <span className="ml-2 text-sm font-normal text-gray-500">({filteredRestaurants.length})</span>
          </h2>
          {filteredRestaurants.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-xl font-bold text-gray-700">No restaurants found</p>
              <p className="text-gray-500 mt-2">Try a different search or category</p>
              <button onClick={() => { setSearchQuery(""); setActiveCategory("all"); setActiveFilter("all"); }} className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition">
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={favoriteRestaurants.includes(restaurant.id)}
                  onToggleFavorite={() => toggleFavorite(restaurant.id)}
                  onClick={() => navigate("/menu/" + restaurant.id)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-white text-2xl font-black">Foodyy</p>
              <p className="text-sm mt-1">Delivering happiness, one meal at a time.</p>
            </div>
            <div className="flex flex-wrap gap-6 text-sm justify-center">
              <button onClick={() => navigate("/offers")} className="hover:text-white transition">Offers</button>
              <button onClick={() => navigate("/orders")} className="hover:text-white transition">My Orders</button>
              <button onClick={() => navigate("/favorites")} className="hover:text-white transition">Favorites</button>
              <button onClick={() => navigate("/profile")} className="hover:text-white transition">Profile</button>
            </div>
          </div>
          <p className="text-center text-xs mt-8 text-gray-600">© 2026 Foodyy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

const GRADIENT_COLORS = [
  ['#f97316','#ef4444'], ['#8b5cf6','#ec4899'], ['#06b6d4','#3b82f6'],
  ['#10b981','#059669'], ['#f59e0b','#f97316'], ['#6366f1','#8b5cf6'],
];

function RestaurantPlaceholder({ name }) {
  const idx = name.charCodeAt(0) % GRADIENT_COLORS.length;
  const [c1, c2] = GRADIENT_COLORS[idx];
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <div className="h-full w-full flex items-center justify-center" style={{background: `linear-gradient(135deg, ${c1}, ${c2})`}}>
      <span className="text-white font-black text-4xl opacity-80">{initials}</span>
    </div>
  );
}

function RestaurantCard({ restaurant, isFavorite, onToggleFavorite, onClick }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className={"bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer group border border-gray-100 " + (!restaurant.isOpen ? "opacity-60" : "")}
      onClick={onClick}
    >
      <div className="relative h-44 overflow-hidden">
        {restaurant.image && !imgError ? (
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <RestaurantPlaceholder name={restaurant.name} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-white text-green-700 text-xs font-bold px-2 py-1 rounded-lg shadow">
          <Star size={11} fill="currentColor" className="text-green-600" /> {restaurant.rating}
        </span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={"absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center shadow transition " + (isFavorite ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-400")}
        >
          <svg className="w-4 h-4" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        {!restaurant.isOpen && (
          <div className="absolute inset-0 bg-gray-900/60 flex items-center justify-center">
            <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">Currently Closed</span>
          </div>
        )}
        {restaurant.isNew && (
          <span className="absolute bottom-3 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">NEW</span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <h3 className="font-bold text-gray-900 text-base group-hover:text-orange-600 transition">{restaurant.name}</h3>
          {restaurant.isPureVeg && (
            <span className="flex-shrink-0 w-5 h-5 border-2 border-green-600 rounded flex items-center justify-center ml-2">
              <span className="w-2.5 h-2.5 bg-green-600 rounded-full" />
            </span>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-1 truncate">{restaurant.cuisines.join(" • ")}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Clock size={11} /> {restaurant.eta} min</span>
          <span>•</span>
          <span>₹{restaurant.costForTwo} for two</span>
        </div>
        {restaurant.discount && (
          <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
            <p className="text-xs text-orange-600 font-semibold">🏷️ {restaurant.discount}</p>
          </div>
        )}
      </div>
    </div>
  );
}
