import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import Button from './Button';
import { ShoppingCart, Tag, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CartSidebar() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, discountedTotal, couponDiscount, isCartOpen, setIsCartOpen, appliedCoupon, applyCoupon, removeCoupon } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponInput);
    setCouponMessage(result.message);
    if (result.success) {
      setCouponInput('');
    }
  };

  return (
    <>
      {/* Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setIsCartOpen(false)} />
      )}

      {/* Cart Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-orange-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Your Cart</h2>
          </div>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cartItems.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Your cart is empty</p>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">₹{item.price}</p>
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 rounded font-semibold transition"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-semibold text-gray-700">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 rounded font-semibold transition"
                  >
                    +
                  </button>
                </div>

                <p className="text-right text-sm font-semibold text-gray-800 mt-2">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-6 space-y-4">
            <div className="rounded-xl border border-orange-100 bg-orange-50/70 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <Tag size={16} className="text-orange-500" />
                Apply Coupon
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-orange-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-slate-500">Discount applied successfully.</p>
                  </div>
                  <button onClick={removeCoupon} className="text-xs font-semibold text-slate-600 hover:text-red-500">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(event) => setCouponInput(event.target.value)}
                    placeholder="Enter code"
                    className="flex-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                  />
                  <button onClick={handleApplyCoupon} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">
                    Apply
                  </button>
                </div>
              )}
              {couponMessage && <p className="text-xs text-slate-500">{couponMessage}</p>}
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-gray-200">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="text-2xl font-bold text-orange-500">₹{cartTotal.toFixed(2)}</span>
            </div>

            {couponDiscount > 0 && (
              <div className="flex justify-between items-center text-sm text-emerald-700">
                <span>Coupon Discount</span>
                <span>- ₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-base font-bold text-slate-800">
              <span>Payable</span>
              <span>₹{discountedTotal.toFixed(2)}</span>
            </div>

            <Link to="/checkout" className="w-full block" onClick={() => setIsCartOpen(false)}>
              <Button className="w-full justify-center rounded-2xl">Proceed to Checkout</Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
