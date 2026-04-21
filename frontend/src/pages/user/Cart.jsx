import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import NavbarWithCart from '../../components/common/NavbarWithCart';
import CartSidebar from '../../components/common/CartSidebar';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { placeOrder } from '../../api/orderApi';

export default function Cart() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartItems, cartTotal, clearCart, discountedTotal, couponDiscount, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [placing, setPlacing] = useState(false);

  const handleApplyCoupon = () => {
    const res = applyCoupon(couponCode);
    if (res.success) {
      showToast(res.message, { type: 'success' });
    } else {
      showToast(res.message, { type: 'error' });
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    showToast('Coupon removed', { type: 'info' });
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) return showToast('Cart is empty', { type: 'error' });
    if (!user || !user.id) {
      showToast('Please login to place an order', { type: 'error' });
      return navigate('/login');
    }
    setPlacing(true);
    try {
      // Build payload compatible with backend `/orders` used by CheckoutPage
      const restaurantId = cartItems[0]?.restaurantId;
      const finalAmount = Number((discountedTotal + 30 + discountedTotal * 0.05).toFixed(2));

      const payload = {
        customerId: user?.id || null,
        restaurantId,
        deliveryAddress: null,
        totalPrice: finalAmount,
        items: cartItems.map((it) => ({ foodItemId: it.id, quantity: it.quantity || 1 })),
      };

      await placeOrder(payload);
      showToast('Order placed successfully', { type: 'success' });
      clearCart();
      navigate('/orders');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to place order', { type: 'error' });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="mt-2 text-sm text-gray-600">Review your items and place the order from one full page.</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-3xl bg-white px-8 py-16 text-center shadow-md">
            <p className="text-gray-500">Your cart is currently empty.</p>
            <Button onClick={() => navigate('/home')} className="mt-6">
              Browse restaurants
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
            <div className="rounded-3xl bg-white p-6 shadow-md sm:p-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <span className="text-lg font-semibold text-gray-900">Items</span>
                <span className="text-sm text-gray-600">{cartItems.length} item(s)</span>
              </div>
              <div className="space-y-4">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.name || item.title || 'Item'}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.restaurantName || item.description || ''}</p>
                    </div>
                    <div className="text-right">
                      <span className="block font-semibold text-gray-900">Rs. {Number(item.price ?? 0).toFixed(2)}</span>
                      <span className="mt-1 block text-xs text-gray-500">Qty: {item.quantity || 1}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-md sm:p-8 lg:sticky lg:top-24 lg:self-start">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-lg font-semibold text-gray-900">Order Summary</span>
                <span className="text-sm text-gray-500">Ready to place</span>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-semibold">Subtotal</span>
                  <span className="font-bold">Rs. {Number(cartTotal ?? 0).toFixed(2)}</span>
                </div>
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 rounded-lg border px-3 py-2"
                      placeholder="Enter coupon code"
                    />
                    <Button onClick={handleApplyCoupon} className="px-4">Apply</Button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 flex items-center justify-between gap-3 text-sm text-gray-600">
                      <div>
                        Applied: <strong>{appliedCoupon.code}</strong> - discount Rs. {Number(couponDiscount).toFixed(2)}
                      </div>
                      <button onClick={handleRemoveCoupon} className="text-sm text-rose-600">Remove</button>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Discount</span>
                      <span className="text-sm">-Rs. {Number(couponDiscount ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>Rs. {Number(discountedTotal ?? cartTotal ?? 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <Button onClick={handlePlaceOrder} className="w-full" disabled={placing}>
                    {placing ? 'Placing order...' : 'Place Order'}
                  </Button>
                  <Button variant="secondary" onClick={clearCart} className="w-full">
                    Clear Cart
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
