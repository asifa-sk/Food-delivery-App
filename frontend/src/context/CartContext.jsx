import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient from '../api/apiClient';

const CartContext = createContext();

const AVAILABLE_COUPONS = {
  BURGER40:  { code: 'BURGER40',  type: 'percent', value: 40,  minTotal: 399 },
  SWEETBOGO: { code: 'SWEETBOGO', type: 'flat',    value: 120, minTotal: 299 },
  FREEDEL3:  { code: 'FREEDEL3',  type: 'flat',    value: 30,  minTotal: 199 },
  FLASH25:   { code: 'FLASH25',   type: 'percent', value: 25,  minTotal: 299 },
  MUNCH50:   { code: 'MUNCH50',   type: 'flat',    value: 50,  minTotal: 399 },
  WEEKEND20: { code: 'WEEKEND20', type: 'percent', value: 20,  minTotal: 249 },
};

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCoupon = localStorage.getItem('cart_coupon');
    try {
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCartItems(Array.isArray(parsedCart) ? parsedCart : []);
      }
    } catch (error) {
      console.error('invalid stored cart payload', error);
      localStorage.removeItem('cart');
      setCartItems([]);
    }
    try {
      if (savedCoupon) {
        setAppliedCoupon(JSON.parse(savedCoupon));
      }
    } catch (error) {
      console.error('invalid stored coupon payload', error);
      localStorage.removeItem('cart_coupon');
      setAppliedCoupon(null);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('cart_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('cart_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (item) => {
    setCartItems((prev) => {
      const existingItem = prev.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        return prev.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, ...item, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const couponDiscount = appliedCoupon
    ? appliedCoupon.type === 'percent'
      ? Number((cartTotal * appliedCoupon.value / 100).toFixed(2))
      : Math.min(appliedCoupon.value, cartTotal)
    : 0;

  const discountedTotal = Math.max(cartTotal - couponDiscount, 0);

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  const applyCoupon = (couponCode) => {
    const normalized = couponCode.trim().toUpperCase();
    const coupon = AVAILABLE_COUPONS[normalized];

    if (!coupon) {
      return { success: false, message: 'Invalid coupon code.' };
    }

    if (cartTotal < coupon.minTotal) {
      return { success: false, message: `Minimum order Rs. ${coupon.minTotal} required.` };
    }

    setAppliedCoupon(coupon);
    return { success: true, message: `${coupon.code} applied successfully.` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const syncCartWithLatestPrices = useCallback(async () => {
    if (!cartItems.length) {
      return { changed: false, removedCount: 0, updatedCount: 0 };
    }

    const results = await Promise.all(
      cartItems.map(async (item) => {
        try {
          const { data } = await apiClient.get(`/food/${item.id}`);
          if (!data || data.available === false) {
            return { type: 'remove', item };
          }

          const normalizedPrice = Number(data.price ?? item.price ?? 0);
          const nextItem = {
            ...item,
            name: data.name || item.name,
            description: data.description ?? item.description,
            price: normalizedPrice,
            category: data.category || item.category,
            image: data.imageUrl || item.image,
            restaurantId: data.restaurant?.id || item.restaurantId,
            restaurantName: data.restaurant?.name || item.restaurantName,
          };
          const changed =
            Number(item.price ?? 0) !== normalizedPrice ||
            item.name !== nextItem.name ||
            item.description !== nextItem.description ||
            item.image !== nextItem.image ||
            item.restaurantName !== nextItem.restaurantName;

          return { type: 'keep', item: nextItem, changed };
        } catch (error) {
          return { type: 'remove', item };
        }
      })
    );

    const nextItems = results
      .filter((result) => result.type === 'keep')
      .map((result) => result.item);
    const removedCount = results.filter((result) => result.type === 'remove').length;
    const updatedCount = results.filter((result) => result.type === 'keep' && result.changed).length;
    const changed = removedCount > 0 || updatedCount > 0;

    if (changed) {
      setCartItems(nextItems);
    }

    return { changed, removedCount, updatedCount };
  }, [cartItems]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        discountedTotal,
        couponDiscount,
        cartCount,
        isCartOpen,
        setIsCartOpen,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        syncCartWithLatestPrices,
        availableCoupons: Object.values(AVAILABLE_COUPONS),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
