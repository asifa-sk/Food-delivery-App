import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Tag, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import Button from './Button';

export default function CartSidebar() {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    cartTotal,
    discountedTotal,
    couponDiscount,
    isCartOpen,
    setIsCartOpen,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    syncCartWithLatestPrices,
  } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput);
    setCouponMessage(result.message);
    if (result.success) {
      setCouponInput('');
    }
  };

  useEffect(() => {
    if (!isCartOpen || !cartItems.length) return;
    syncCartWithLatestPrices().catch((error) => {
      console.error('sidebar price sync failed', error);
    });
  }, [cartItems.length, isCartOpen, syncCartWithLatestPrices]);

  return (
    <>
      {isCartOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-950/45 backdrop-blur-[2px]"
          onClick={() => setIsCartOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-80 flex-col border-l border-brand-100 bg-white shadow-float transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-brand-100 bg-surface-50 p-6">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-brand-500" size={24} />
            <h2 className="text-xl font-bold text-ink-900">Your Cart</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="text-ink-500 hover:text-ink-700">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-white to-surface-50/70 p-6">
          {cartItems.length === 0 ? (
            <p className="py-8 text-center text-ink-500">Your cart is empty</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="rounded-2xl border border-brand-100 bg-white p-4 shadow-soft">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-ink-800">{item.name}</h3>
                    <p className="mt-1 text-sm text-ink-500">Rs. {item.price}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 transition hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex-1 rounded-xl bg-brand-50 py-1 font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-semibold text-ink-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex-1 rounded-xl bg-brand-50 py-1 font-semibold text-brand-700 transition hover:bg-brand-100"
                  >
                    +
                  </button>
                </div>

                <p className="mt-2 text-right text-sm font-semibold text-ink-800">
                  Rs. {(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="space-y-4 border-t border-brand-100 bg-white p-6">
            <div className="space-y-3 rounded-2xl border border-brand-100 bg-surface-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
                <Tag size={16} className="text-brand-500" />
                Apply Coupon
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-brand-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-ink-500">Discount applied successfully.</p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs font-semibold text-ink-600 hover:text-red-500">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value)}
                    placeholder="Enter code"
                    className="flex-1 rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
                  />
                  <button onClick={handleApplyCoupon} className="rounded-xl bg-brand-500 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-600">
                    Apply
                  </button>
                </div>
              )}
              {couponMessage && <p className="text-xs text-ink-500">{couponMessage}</p>}
            </div>

            <div className="flex items-center justify-between border-b border-brand-100 pb-4">
              <span className="font-semibold text-ink-700">Total:</span>
              <span className="text-2xl font-bold text-brand-600">Rs. {cartTotal.toFixed(2)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-sm text-success-700">
                <span>Coupon Discount</span>
                <span>- Rs. {couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-base font-bold text-ink-800">
              <span>Payable</span>
              <span>Rs. {discountedTotal.toFixed(2)}</span>
            </div>

            <Link to="/checkout" className="block w-full" onClick={() => setIsCartOpen(false)}>
              <Button className="w-full justify-center rounded-2xl">Proceed to Checkout</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
