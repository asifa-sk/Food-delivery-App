import { useEffect, useMemo, useState } from 'react';
import { CreditCard, HandCoins, MapPin, Receipt, ShieldCheck, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import NavbarWithCart from '../../components/common/NavbarWithCart';
import CartSidebar from '../../components/common/CartSidebar';
import Button from '../../components/common/Button';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../components/common/Toast';
import { calculateDeliveryCharge } from '../../utils/deliveryTracking';

const PAYMENT_OPTIONS = [
  {
    id: 'cash_on_delivery',
    title: 'Cash on delivery',
    description: 'Pay when your food reaches you.',
    icon: HandCoins,
    active: true,
  },
  {
    id: 'online',
    title: 'UPI / Credit / Debit Card',
    description: 'Pay securely online and continue to the payment page.',
    icon: CreditCard,
    active: true,
  },
];

const PLATFORM_CHARGE = 15;

const getPaymentLabel = (method) => {
  switch (method) {
    case 'cash_on_delivery':
      return 'Cash on delivery';
    case 'upi':
      return 'UPI';
    case 'online':
      return 'UPI / Credit / Debit Card';
    default:
      return 'UPI / Credit / Debit Card';
  }
};

const normalizePaymentMethod = (method) => {
  if (method === 'upi') return 'online';
  if (method === 'cash_on_delivery') return 'cash_on_delivery';
  return 'online';
};

export default function Cart() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    cartItems,
    cartTotal,
    discountedTotal,
    couponDiscount,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    clearCart,
    syncCartWithLatestPrices,
  } = useCart();
  const { showToast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [distanceKm, setDistanceKm] = useState(sessionStorage.getItem('checkout_distance_km') || '3');
  const [paymentMethod, setPaymentMethod] = useState(
    normalizePaymentMethod(sessionStorage.getItem('checkout_payment_method') || 'cash_on_delivery')
  );
  const [checkingPrices, setCheckingPrices] = useState(false);

  const deliveryCharge = useMemo(() => calculateDeliveryCharge(distanceKm), [distanceKm]);
  const taxAmount = PLATFORM_CHARGE;
  const finalAmount = useMemo(
    () => Number((discountedTotal + deliveryCharge + taxAmount).toFixed(2)),
    [deliveryCharge, discountedTotal, taxAmount]
  );

  useEffect(() => {
    const syncPrices = async () => {
      if (!cartItems.length) return;
      setCheckingPrices(true);
      try {
        const result = await syncCartWithLatestPrices();
        if (result.updatedCount > 0) {
          showToast('Latest menu prices were refreshed in your cart.', { type: 'info' });
        }
        if (result.removedCount > 0) {
          showToast('Some unavailable items were removed from your cart.', { type: 'info' });
        }
      } catch (error) {
        console.error('cart price sync failed', error);
      } finally {
        setCheckingPrices(false);
      }
    };

    syncPrices();
  }, [cartItems.length, showToast, syncCartWithLatestPrices]);

  const handleApplyCoupon = () => {
    const result = applyCoupon(couponCode);
    showToast(result.message, { type: result.success ? 'success' : 'error' });
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    showToast('Coupon removed', { type: 'info' });
  };

  const handleProceedToCheckout = () => {
    if (!cartItems.length) {
      return showToast('Cart is empty', { type: 'error' });
    }
    if (!user || !user.id) {
      showToast('Please login to continue', { type: 'error' });
      return navigate('/login');
    }
    sessionStorage.setItem('checkout_payment_method', paymentMethod);
    sessionStorage.setItem('checkout_distance_km', String(distanceKm));
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-hero-warm">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-500 via-brand-500 to-brand-400 shadow-float">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-100">
                <Receipt size={14} />
                Confirm order
              </p>
              <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">Review your order before checkout</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-200 md:text-base">
                This follows your flow more closely: review items, choose payment, confirm the order, then complete checkout and tracking.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Items</p>
                <p className="mt-2 text-3xl font-bold text-white">{cartItems.length}</p>
                <p className="mt-1 text-sm text-ink-200">{checkingPrices ? 'Checking latest prices' : 'Ready to confirm'}</p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Delivery</p>
                <p className="mt-2 text-3xl font-bold text-white">{distanceKm} km</p>
                <p className="mt-1 text-sm text-ink-200">Estimated route</p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Payable</p>
                <p className="mt-2 text-3xl font-bold text-white">Rs. {finalAmount.toFixed(2)}</p>
                <p className="mt-1 text-sm text-ink-200">Based on latest menu pricing</p>
              </div>
            </div>
          </div>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-[2rem] border border-brand-100 bg-white px-8 py-16 text-center shadow-soft">
            <p className="text-ink-500">Your cart is currently empty.</p>
            <Button onClick={() => navigate('/home')} className="mt-6">
              Browse restaurants
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.88fr)]">
            <div className="space-y-6">
              <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Cart items</p>
                    <h2 className="mt-2 text-2xl font-bold text-ink-900">Your selections</h2>
                  </div>
                  <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                    {cartItems.length} item(s)
                  </span>
                </div>

                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-brand-100 bg-surface-50 p-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-ink-900">{item.name || item.title || 'Item'}</p>
                        <p className="mt-1 text-sm text-ink-500">{item.restaurantName || item.description || 'Freshly prepared for you'}</p>
                      </div>
                      <div className="text-right">
                        <span className="block font-bold text-brand-600">Rs. {Number(item.price ?? 0).toFixed(2)}</span>
                        <span className="mt-1 block text-xs text-ink-500">Qty: {item.quantity || 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                    <HandCoins size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Payment</p>
                    <h2 className="mt-1 text-2xl font-bold text-ink-900">Choose how the customer will pay</h2>
                  </div>
                </div>

                <div className="grid gap-4">
                  {PAYMENT_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const selected = paymentMethod === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        disabled={!option.active}
                        onClick={() => option.active && setPaymentMethod(option.id)}
                        className={`rounded-[1.5rem] border p-5 text-left transition ${
                          selected
                            ? 'border-[#f0c79f] bg-[#fff8f2] shadow-soft'
                            : option.active
                              ? 'border-brand-100 bg-white hover:border-[#f0c79f] hover:bg-surface-50'
                              : 'cursor-not-allowed border-ink-200 bg-ink-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${selected ? 'bg-white text-brand-600 ring-2 ring-[#f4d5b7]' : 'bg-brand-100 text-brand-700'}`}>
                            <Icon size={20} />
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selected ? 'bg-[#2bc866] text-white' : 'bg-brand-100 text-brand-700'}`}>
                            {option.active ? (selected ? 'Selected' : 'Available') : 'Soon'}
                          </span>
                        </div>
                        <p className="mt-4 text-lg font-bold text-ink-900">{option.title}</p>
                        <p className="mt-2 text-sm leading-6 text-ink-500">{option.description}</p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-[1.5rem] border border-success-100 bg-success-50 p-4 text-sm text-success-700">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                  Online payment now continues into a dedicated payment page, while cash on delivery still works in the same order flow.
                </div>
              </section>
            </div>

            <aside className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8 xl:sticky xl:top-24 xl:self-start">
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Summary</p>
                <h2 className="mt-2 text-2xl font-bold text-ink-900">Order details</h2>
              </div>

              <div className="space-y-4 rounded-[1.75rem] border border-brand-100 bg-surface-50 p-5">
                <div>
                  <label className="text-sm font-semibold text-ink-700">Delivery distance (km)</label>
                  <div className="relative mt-2">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-500" size={18} />
                    <input
                      type="number"
                      value={distanceKm}
                      min="0"
                      onChange={(event) => setDistanceKm(event.target.value)}
                      className="w-full rounded-2xl border border-brand-200 bg-white py-3 pl-11 pr-4 text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-ink-700">Have a coupon?</label>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(event) => setCouponCode(event.target.value)}
                      className="flex-1 rounded-2xl border border-brand-200 bg-white px-4 py-3 text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                      placeholder="Enter coupon code"
                    />
                    <Button onClick={handleApplyCoupon} className="px-4">
                      Apply
                    </Button>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-ink-600">
                      <div>
                        Applied: <strong className="text-brand-700">{appliedCoupon.code}</strong>
                        <span className="ml-1">- Rs. {Number(couponDiscount).toFixed(2)}</span>
                      </div>
                      <button onClick={handleRemoveCoupon} className="font-semibold text-brand-700">
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-brand-100 pt-4 text-sm text-ink-600">
                  <div className="flex items-center justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-ink-800">Rs. {Number(cartTotal ?? 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Delivery charge</span>
                    <span className="font-semibold text-ink-800">Rs. {deliveryCharge.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Platform charge</span>
                    <span className="font-semibold text-ink-800">Rs. {taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount</span>
                    <span className="font-semibold text-success-700">- Rs. {Number(couponDiscount ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] bg-brand-500 px-5 py-4 text-white">
                  <div className="flex items-center justify-between text-sm text-ink-200">
                    <span>Payment method</span>
                    <span className="font-semibold text-brand-200">
                      {getPaymentLabel(paymentMethod)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-2xl font-bold">
                    <span>Total</span>
                    <span>Rs. {finalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-[1.5rem] border border-brand-100 bg-white p-4 text-sm text-ink-600">
                  <Truck size={18} className="mt-0.5 shrink-0 text-brand-500" />
                  Confirm the order here, then finish the delivery details in checkout and move into the orders tracking stage.
                </div>

                <Button onClick={handleProceedToCheckout} className="w-full">
                  Proceed to Checkout
                </Button>
                <Button variant="secondary" onClick={clearCart} className="w-full">
                  Clear Cart
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
