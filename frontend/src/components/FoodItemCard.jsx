import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { useToast } from './common/Toast';
import { Heart, Plus, Star } from 'lucide-react';

const CATEGORY_IMAGES = {
  burger: [
    'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/1639562/pexels-photo-1639562.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
  biryani: [
    'https://images.pexels.com/photos/12737816/pexels-photo-12737816.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/7394819/pexels-photo-7394819.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
  momos: [
    'https://images.pexels.com/photos/3026808/pexels-photo-3026808.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/6646035/pexels-photo-6646035.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/5835350/pexels-photo-5835350.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
  desserts: [
    'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/45202/brownie-chocolate-dessert-cake-45202.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
  pizza: [
    'https://images.pexels.com/photos/825661/pexels-photo-825661.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/905847/pexels-photo-905847.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
  chinese: [
    'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/699953/pexels-photo-699953.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/2092906/pexels-photo-2092906.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
  'south-indian': [
    'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/4331491/pexels-photo-4331491.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    'https://images.pexels.com/photos/7625056/pexels-photo-7625056.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  ],
};

const DEFAULT_IMAGES = [
  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  'https://images.pexels.com/photos/70497/pexels-photo-70497.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
  'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
];

const normalizeImageSrc = (value) => {
  const raw = typeof value === 'string' ? value.trim() : '';
  if (!raw) return '';

  if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:|blob:)/i.test(raw)) {
    return raw;
  }

  return raw;
};

export default function FoodItemCard({ item, isFavorite = false, onToggleFavorite }) {
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const fallbackPool = CATEGORY_IMAGES[item.category?.toLowerCase()] || DEFAULT_IMAGES;
  const seed = Number(item.id) || 1;

  const primaryFallback = useMemo(() => fallbackPool[seed % fallbackPool.length], [fallbackPool, seed]);
  const secondaryFallback = useMemo(
    () => fallbackPool[(seed + 1) % fallbackPool.length],
    [fallbackPool, seed]
  );

  const preferredImage = normalizeImageSrc(item.imageUrl || item.image) || primaryFallback;
  const [imageSrc, setImageSrc] = useState(preferredImage);

  useEffect(() => {
    setImageSrc(preferredImage);
  }, [preferredImage]);

  const handleImageError = () => {
    if (imageSrc !== secondaryFallback) {
      setImageSrc(secondaryFallback);
      return;
    }
    setImageSrc(DEFAULT_IMAGES[seed % DEFAULT_IMAGES.length]);
  };

  const handleAddToCart = () => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      image: imageSrc,
      restaurantId: item.restaurant?.id || item.restaurantId,
      restaurantName: item.restaurant?.name || item.restaurantName,
      rating: item.rating,
    });
    if (typeof showToast === 'function') showToast('Item added to cart', { type: 'success' });
  };

  return (
    <div className="group overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition-all hover:shadow-lg">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-40 sm:h-auto sm:w-56 md:w-64 flex-shrink-0 overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={item.name}
            loading="lazy"
            onError={handleImageError}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
          {onToggleFavorite && (
            <button
              onClick={onToggleFavorite}
              className={`absolute top-4 right-4 rounded-full p-2 transition ${
                isFavorite ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-500 hover:text-rose-500'
              }`}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                  {item.description || 'Freshly prepared and delivered hot.'}
                </p>
              </div>
              {item.rating && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                  <Star size={12} fill="currentColor" />
                  {item.rating}
                </span>
              )}
            </div>

            <div className="mt-4">
              <span className="text-3xl font-bold text-orange-500">Rs. {item.price}</span>
              <p className="mt-1 text-sm text-slate-500">Top pick in {item.restaurantName || 'this restaurant'}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="text-sm font-medium text-slate-500">{item.category || 'Popular item'}</div>
            <button
              onClick={handleAddToCart}
              className="inline-flex min-w-[170px] items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white transition hover:bg-orange-600 group-hover:shadow-md"
            >
              <Plus size={18} />
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
