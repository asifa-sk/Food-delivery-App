import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Headset, Search, Star, Truck, MapPin } from 'lucide-react';
import NavbarWithCart from '../components/common/NavbarWithCart';
import CartSidebar from '../components/common/CartSidebar';
import FoodItemCard from '../components/FoodItemCard';
import Loader from '../components/common/Loader';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../api/apiClient';
import { useToast } from '../components/common/Toast';
import { readFavoriteItems, writeFavoriteItems } from '../utils/favoritesStorage';

const formatCategory = (category) => {
  if (!category) return 'Other';
  return category
    .toString()
    .trim()
    .split(/[-_\s]+/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
};

const getBannerImage = (restaurant) => {
  if (restaurant?.imageUrl && /^https?:\/\//i.test(restaurant.imageUrl)) {
    return restaurant.imageUrl;
  }
  return 'https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=1400&q=80';
};

export default function RestaurantMenuPage() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [favoriteItemIds, setFavoriteItemIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const categoryRefs = useRef({});

  useEffect(() => {
    try {
      const stored = readFavoriteItems(user?.id);
      setFavoriteItemIds(stored.map((item) => item.id));
    } catch (error) {
      console.error('favoriteItems parse failed', error);
    }

    let active = true;

    const fetchRestaurant = async () => {
      setIsLoading(true);
      setError('');

      try {
        const [restaurantResponse, menuResponse] = await Promise.all([
          apiClient.get(`/restaurants/${restaurantId}`),
          apiClient.get(`/food/restaurant/${restaurantId}`),
        ]);

        if (!active) return;

        const restaurantData = restaurantResponse.data;
        const foodItems = Array.isArray(menuResponse.data)
          ? menuResponse.data.map((item) => ({
              ...item,
              restaurantId: item.restaurant?.id || item.restaurantId,
              restaurantName: item.restaurant?.name || item.restaurantName,
            }))
          : [];

        setRestaurant(restaurantData);
        setMenuItems(foodItems);
        if (!selectedCategory && foodItems.length > 0) {
          setSelectedCategory(foodItems[0].category?.toLowerCase() || 'other');
        }
      } catch (fetchError) {
        console.error(fetchError);
        if (!active) return;
        setError('Unable to load the restaurant menu right now. Please try again later.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchRestaurant();
    return () => {
      active = false;
    };
  }, [restaurantId, selectedCategory, user?.id]);

  const categories = useMemo(() => {
    const seen = new Set();
    return menuItems.reduce((list, item) => {
      const category = item.category?.toString().trim().toLowerCase() || 'other';
      if (!seen.has(category)) {
        seen.add(category);
        list.push(category);
      }
      return list;
    }, []);
  }, [menuItems]);

  useEffect(() => {
    if (categories.length && !selectedCategory) {
      setSelectedCategory(categories[0]);
    }
  }, [categories, selectedCategory]);

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return menuItems;

    return menuItems.filter((item) => {
      const name = item.name?.toString().toLowerCase() || '';
      const description = item.description?.toString().toLowerCase() || '';
      const category = item.category?.toString().toLowerCase() || '';
      return (
        name.includes(normalizedQuery) ||
        description.includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    });
  }, [menuItems, searchQuery]);

  const groupedItems = useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      const category = item.category?.toString().trim().toLowerCase() || 'other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [filteredItems]);

  const topRatedItems = useMemo(() => {
    return [...menuItems]
      .filter((item) => Number(item.rating) > 0)
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
      .slice(0, 3);
  }, [menuItems]);

  const toggleFavoriteItem = (itemId) => {
    const exists = favoriteItemIds.includes(itemId);
    const updatedIds = exists
      ? favoriteItemIds.filter((id) => id !== itemId)
      : [...favoriteItemIds, itemId];
    setFavoriteItemIds(updatedIds);

    try {
      let updated = readFavoriteItems(user?.id).slice();
      if (exists) {
        updated = updated.filter((item) => String(item.id) !== String(itemId));
      } else {
        const item = menuItems.find((menuItem) => String(menuItem.id) === String(itemId));
        if (item) {
          updated.push({
            id: item.id,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl || item.image || null,
            restaurantId: item.restaurantId,
            restaurantName: item.restaurantName,
            category: item.category,
          });
        }
      }
      writeFavoriteItems(user?.id, updated);
    } catch (error) {
      console.error('persist favoriteItems failed', error);
    }

    try {
      if (typeof showToast === 'function') {
        showToast(exists ? 'Removed from favorites' : 'Added to favorites', { type: 'success' });
      }
    } catch (error) {
      console.error('favorite toast failed', error);
    }
  };

  const activeCategory = useMemo(() => {
    if (selectedCategory && categories.includes(selectedCategory)) {
      return selectedCategory;
    }
    return categories[0] || null;
  }, [categories, selectedCategory]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    const section = categoryRefs.current[category];
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const restaurantRating = Number(restaurant?.rating || 0).toFixed(1);
  const restaurantAddress = restaurant?.address || 'Address not available';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-hero-warm">
        <NavbarWithCart user={user} onLogout={logout} />
        <CartSidebar />
        <main className="mx-auto max-w-6xl px-4 py-10">
          <Loader message="Loading restaurant menu..." />
        </main>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-hero-warm">
        <NavbarWithCart user={user} onLogout={logout} />
        <CartSidebar />
        <main className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-3xl border border-brand-100 bg-white p-10 text-center shadow-soft">
            <h1 className="mb-4 text-3xl font-bold text-ink-900">Restaurant menu unavailable</h1>
            <p className="mb-6 text-ink-600">{error || 'The selected restaurant could not be loaded.'}</p>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600"
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-hero-warm">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-brand-100 bg-ink-950 shadow-float">
          <img
            src={getBannerImage(restaurant)}
            alt={restaurant.name}
            className="h-72 w-full object-cover brightness-[0.75] md:h-96"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-8 md:px-10 md:pb-10">
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand-500/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.2em] text-brand-100 shadow-soft">
              <MapPin size={16} /> {restaurant.cuisineType || 'Multi-cuisine'}
            </p>
            <h1 className="text-3xl font-bold text-white md:text-5xl">{restaurant.name}</h1>
            <p className="mt-4 max-w-3xl text-sm text-ink-200 sm:text-base md:text-lg">{restaurantAddress}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                <Star size={16} className="text-brand-300" /> {restaurantRating}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                <Truck size={16} className="text-brand-300" /> Ready to serve
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white">
                <Headset size={16} className="text-brand-300" /> {restaurant.contactNumber || 'Support available'}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-brand-500">Restaurant menu</p>
              <h2 className="mt-3 text-3xl font-bold text-ink-900">Explore dishes by category</h2>
              <p className="mt-2 max-w-2xl text-sm text-ink-500">
                Search, compare, and choose your favorites from the freshest menu items.
              </p>
            </div>

            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search food items, categories, or ingredients"
                className="w-full rounded-3xl border border-brand-200 bg-surface-50 py-3 pl-12 pr-4 text-sm text-ink-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-200"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-nowrap gap-3 overflow-x-auto pb-2">
            {categories.length ? (
              categories.map((category) => {
                const active = activeCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => handleCategoryClick(category)}
                    className={`whitespace-nowrap rounded-full border px-5 py-3 text-sm font-semibold transition ${
                      active
                        ? 'border-brand-500 bg-brand-500 text-white shadow-glow'
                        : 'border-brand-100 bg-surface-50 text-ink-700 hover:border-brand-300 hover:bg-brand-50'
                    }`}
                  >
                    {formatCategory(category)}
                  </button>
                );
              })
            ) : (
              <div className="rounded-3xl border border-brand-100 bg-surface-50 px-5 py-3 text-sm text-ink-600">
                No categories available for this restaurant.
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[1.7fr_0.8fr]">
          <div className="space-y-8">
            {categories.map((category) => {
              const items = groupedItems[category] || [];
              return (
                <section
                  key={category}
                  ref={(element) => {
                    categoryRefs.current[category] = element;
                  }}
                  className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft"
                >
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-ink-900">{formatCategory(category)}</h3>
                      <p className="mt-2 text-sm text-ink-500">
                        {items.length} {items.length === 1 ? 'item' : 'items'} available in this category.
                      </p>
                    </div>
                    {items.length > 0 && (
                      <div className="rounded-3xl bg-surface-50 px-4 py-2 text-sm text-ink-600">
                        {searchQuery ? 'Filtered results' : 'Popular choices'}
                      </div>
                    )}
                  </div>

                  {items.length > 0 ? (
                    <div className="space-y-5">
                      {items.map((item) => (
                        <FoodItemCard
                          key={item.id}
                          item={item}
                          isFavorite={favoriteItemIds.includes(item.id)}
                          onToggleFavorite={() => toggleFavoriteItem(item.id)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-brand-100 bg-surface-50 p-12 text-center text-ink-500">
                      No matching dishes found in this category.
                    </div>
                  )}
                </section>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="rounded-3xl border border-dashed border-brand-100 bg-surface-50 p-12 text-center text-ink-600">
                <p className="text-lg font-semibold text-ink-900">No dishes match your search.</p>
                <p className="mt-3 text-sm text-ink-500">Try a different keyword or clear the search to view the full menu.</p>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Restaurant info</p>
              <h3 className="mt-4 text-xl font-semibold text-ink-900">Why order from here</h3>
              <ul className="mt-5 space-y-4 text-sm text-ink-600">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  Fresh menu selections hand-curated by the chef.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  Real-time order tracking and faster checkout.
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
                  Contact support available at {restaurant.contactNumber || 'N/A'}.
                </li>
              </ul>
            </div>

            {topRatedItems.length > 0 && (
              <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-500">Top picks</p>
                <h3 className="mt-4 text-xl font-semibold text-ink-900">Most loved dishes</h3>
                <div className="mt-4 space-y-4 text-sm text-ink-600">
                  {topRatedItems.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-surface-50 p-4">
                      <p className="font-semibold text-ink-900">{item.name}</p>
                      <p className="mt-1 text-ink-500">{item.description || 'Delicious choice'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-3xl border border-brand-100 bg-white p-6 shadow-soft">
              <div className="flex items-center gap-3">
                <Headset className="text-brand-500" size={20} />
                <div>
                  <h3 className="text-lg font-semibold text-ink-900">Customer support</h3>
                  <p className="text-sm text-ink-500">Need help with your order? We are here to assist anytime.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
