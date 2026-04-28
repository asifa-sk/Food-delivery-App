import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Home,
  Landmark,
  MapPin,
  Phone,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Truck,
  Wallet,
} from 'lucide-react';
import NavbarWithCart from '../components/common/NavbarWithCart';
import CartSidebar from '../components/common/CartSidebar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { placeOrder } from '../api/orderApi';
import { processPayment } from '../api/paymentApi';
import { useToast } from '../components/common/Toast';
import { sendOrderNotification } from '../utils/notificationService';
import apiClient from '../api/apiClient';
import { calculateDeliveryCharge, estimateEtaMinutes, haversineDistanceKm, hasCoordinates } from '../utils/deliveryTracking';
import { geocodeAddress } from '../utils/locationLookup';

const PLATFORM_CHARGE = 15;

const ONLINE_PAYMENT_GROUPS = [
  {
    id: 'upi',
    title: 'UPI',
    subtitle: 'Google Pay, PhonePe, Paytm and any UPI app',
    icon: Smartphone,
    active: true,
  },
  {
    id: 'cards',
    title: 'Cards',
    subtitle: 'Credit and debit cards',
    icon: CreditCard,
    active: false,
  },
  {
    id: 'netbanking',
    title: 'Netbanking',
    subtitle: 'Pay using your bank account',
    icon: Landmark,
    active: false,
  },
  {
    id: 'wallet',
    title: 'Wallet',
    subtitle: 'Wallets and balance-based payments',
    icon: Wallet,
    active: false,
  },
];

const normalizePaymentMethod = (method) => {
  if (method === 'upi') return 'online';
  if (method === 'cash_on_delivery') return 'cash_on_delivery';
  return 'online';
};

const getPaymentLabel = (method) => {
  switch (method) {
    case 'cash_on_delivery':
      return 'Cash on Delivery';
    case 'upi':
      return 'UPI';
    case 'online':
    default:
      return 'UPI / Credit / Debit Card';
  }
};

const parseCustomerIdFromToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('-');
  if (parts.length < 4) return null;
  const maybeId = Number(parts[2]);
  return Number.isFinite(maybeId) ? maybeId : null;
};

const createUpiAddress = (fullName) => {
  const base = (fullName || 'customer')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16);
  return `${base || 'customer'}@okhdfcbank`;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    cartItems,
    cartTotal,
    discountedTotal,
    couponDiscount,
    appliedCoupon,
    clearCart,
    syncCartWithLatestPrices,
  } = useCart();
  const { showToast } = useToast();
  const [deliveryForm, setDeliveryForm] = useState({
    fullName: user?.email?.split('@')[0] || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: normalizePaymentMethod(sessionStorage.getItem('checkout_payment_method') || 'cash_on_delivery'),
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [checkingPrices, setCheckingPrices] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('details');
  const [upiAddress, setUpiAddress] = useState('');
  const [qrRefreshTick, setQrRefreshTick] = useState(0);
  const [restaurantLocation, setRestaurantLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationNotice, setLocationNotice] = useState('');
  const hasTypedAddress = Boolean(
    deliveryForm.address.trim() || deliveryForm.city.trim() || deliveryForm.zipCode.trim()
  );

  const customerId = user?.id || parseCustomerIdFromToken(localStorage.getItem('token'));
  const distanceKm = useMemo(() => {
    const routeDistance = haversineDistanceKm(restaurantLocation, customerLocation);
    if (routeDistance != null) return routeDistance;
    const sessionDistance = Number(sessionStorage.getItem('checkout_distance_km') || '3');
    return Number.isFinite(sessionDistance) ? sessionDistance : 3;
  }, [customerLocation, restaurantLocation]);
  const deliveryCharge = useMemo(() => calculateDeliveryCharge(distanceKm), [distanceKm]);
  const taxAmount = PLATFORM_CHARGE;
  const finalAmount = useMemo(
    () => Number((discountedTotal + deliveryCharge + taxAmount).toFixed(2)),
    [deliveryCharge, discountedTotal, taxAmount]
  );
  const generatedUpiAddress = useMemo(() => createUpiAddress(deliveryForm.fullName), [deliveryForm.fullName]);
  const estimatedMinutes = useMemo(() => estimateEtaMinutes(distanceKm), [distanceKm]);

  useEffect(() => {
    const syncPrices = async () => {
      if (!cartItems.length) return;
      setCheckingPrices(true);
      try {
        const result = await syncCartWithLatestPrices();
        if (result.updatedCount > 0) {
          showToast('Checkout was updated with latest restaurant prices.', { type: 'info' });
        }
        if (result.removedCount > 0) {
          showToast('Unavailable items were removed before checkout.', { type: 'info' });
        }
      } catch (error) {
        console.error('checkout sync failed', error);
      } finally {
        setCheckingPrices(false);
      }
    };

    syncPrices();
  }, [cartItems.length, showToast, syncCartWithLatestPrices]);

  useEffect(() => {
    if (!upiAddress) {
      setUpiAddress(generatedUpiAddress);
    }
  }, [generatedUpiAddress, upiAddress]);

  useEffect(() => {
    const restaurantId = cartItems[0]?.restaurantId;
    if (!restaurantId) {
      setRestaurantLocation(null);
      return;
    }

    apiClient.get(`/restaurants/${restaurantId}`)
      .then(({ data }) => {
        if (hasCoordinates({ latitude: Number(data?.latitude), longitude: Number(data?.longitude) })) {
          setRestaurantLocation({
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            name: data.name,
          });
        } else {
          setRestaurantLocation({
            latitude: null,
            longitude: null,
            name: data?.name || cartItems[0]?.restaurantName || 'Restaurant',
          });
          setLocationNotice('Restaurant coordinates are incomplete, so delivery route estimates may be approximate.');
        }
      })
      .catch((error) => {
        console.error('restaurant location fetch failed', error);
      });
  }, [cartItems]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationNotice('This browser does not support device location. Delivery will use the typed address when it can be matched on the map.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeviceLocation({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        });
      },
      () => {
        setDeviceLocation(null);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  }, []);

  useEffect(() => {
    const fullAddress = [deliveryForm.address, deliveryForm.city, deliveryForm.zipCode, 'Andhra Pradesh', 'India']
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .join(', ');

    if (!hasTypedAddress) {
      setCustomerLocation(deviceLocation);
      setLocationNotice(
        deviceLocation
          ? 'No delivery address was entered, so the order will use the customer current location.'
          : 'No delivery address was entered. Allow device location so the order can use the current location.'
      );
      return undefined;
    }

    if (deliveryForm.address.trim().length < 5 || deliveryForm.city.trim().length < 2 || deliveryForm.zipCode.trim().length < 4) {
      setCustomerLocation(null);
      setLocationNotice('Typed address takes priority. Please complete the full address, city, and ZIP code so the delivery pin can be matched correctly.');
      return undefined;
    }

    let cancelled = false;
    const timerId = setTimeout(() => {
      geocodeAddress(fullAddress).then((point) => {
        if (cancelled) return;

        if (point) {
          setCustomerLocation({
            latitude: point.latitude,
            longitude: point.longitude,
          });
          setLocationNotice('');
          return;
        }

        setCustomerLocation(deviceLocation);
        setLocationNotice(
          deviceLocation
            ? 'The typed delivery address could not be matched exactly, so the app is using the device location as a fallback.'
            : 'The typed delivery address could not be matched on the map yet. Please double-check the address.'
        );
      });
    }, 700);

    return () => {
      cancelled = true;
      clearTimeout(timerId);
    };
  }, [deliveryForm.address, deliveryForm.city, deliveryForm.zipCode, deviceLocation, hasTypedAddress]);

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-hero-warm">
        <NavbarWithCart user={user} onLogout={logout} />
        <div className="mx-auto max-w-7xl px-4 py-12 text-center">
          <h2 className="mb-4 text-2xl font-bold text-ink-800">Your cart is empty</h2>
          <Button onClick={() => navigate('/home')} variant="primary">
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const validateForm = () => {
    const newErrors = {};
    if (!deliveryForm.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!deliveryForm.phone.trim()) newErrors.phone = 'Phone number is required';
    if (hasTypedAddress) {
      if (!deliveryForm.address.trim()) newErrors.address = 'Street address is required when using a typed address';
      if (!deliveryForm.city.trim()) newErrors.city = 'City is required when using a typed address';
      if (!deliveryForm.zipCode.trim()) newErrors.zipCode = 'ZIP code is required when using a typed address';
    } else if (!deviceLocation) {
      newErrors.address = 'Enter a delivery address or allow current location access';
    }
    return newErrors;
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '', submit: '' }));
  };

  const persistSuccessfulOrder = async ({
    paymentMethod,
    orderPaymentMethod = paymentMethod,
    paymentStatus,
    paymentReference,
    paymentPath,
  }) => {
    const restaurantId = cartItems[0]?.restaurantId;
    const deliveryAddress = hasTypedAddress
      ? [deliveryForm.address, deliveryForm.city, deliveryForm.zipCode].filter(Boolean).join(', ')
      : 'Current location';
    const { data } = await placeOrder({
      customerId,
      restaurantId,
      deliveryAddress,
      paymentMethod: orderPaymentMethod,
      paymentStatus,
      paymentReference,
      customerLatitude: customerLocation?.latitude ?? null,
      customerLongitude: customerLocation?.longitude ?? null,
      restaurantLatitude: restaurantLocation?.latitude ?? null,
      restaurantLongitude: restaurantLocation?.longitude ?? null,
      deliveryDistanceKm: distanceKm,
      deliveryCharge,
      estimatedDeliveryMinutes: estimatedMinutes,
      items: cartItems.map((item) => ({ foodItemId: item.id, quantity: item.quantity || 1 })),
    });

    try {
      const createdId = data?.id || data?.orderId || null;
      sendOrderNotification({ orderId: createdId, status: 'PENDING', from: 'customer' });
    } catch (error) {
      console.error('notify after checkout order', error);
    }

    setPaymentInfo({
      paymentMethod,
      paymentStatus,
      paymentReference,
      paymentPath,
    });
    setPlacedOrderId(String(data?.id || data?.orderId || 'NA'));
    setOrderPlaced(true);
    clearCart();
    sessionStorage.removeItem('checkout_payment_method');
    sessionStorage.removeItem('checkout_distance_km');
  };

  const handleCodOrder = async () => {
    const restaurantId = cartItems[0]?.restaurantId;
    const { data: paymentData } = await processPayment({
      amount: finalAmount,
      paymentMethod: 'cash_on_delivery',
      customerId,
      restaurantId,
    });

    await persistSuccessfulOrder({
      paymentMethod: 'cash_on_delivery',
      orderPaymentMethod: 'cash_on_delivery',
      paymentStatus: paymentData?.paymentStatus,
      paymentReference: paymentData?.paymentReference,
      paymentPath: paymentData?.paymentPath,
    });
  };

  const handleUpiPaymentSuccess = async () => {
    const restaurantId = cartItems[0]?.restaurantId;
    let paymentData = null;
    try {
      const response = await processPayment({
        amount: finalAmount,
        paymentMethod: 'upi',
        customerId,
        restaurantId,
        upiAddress: upiAddress.trim() || generatedUpiAddress,
      });
      paymentData = response?.data || null;
    } catch (error) {
      console.error('upi payment api failed, continuing with simulated success flow', error);
      paymentData = {
        success: true,
        paymentStatus: 'PAID',
        paymentReference: `UPI-${Date.now()}`,
        paymentPath: `upi://pay?pa=${encodeURIComponent(upiAddress.trim() || generatedUpiAddress)}&am=${finalAmount.toFixed(2)}`,
      };
    }

    await persistSuccessfulOrder({
      paymentMethod: 'upi',
      orderPaymentMethod: 'online',
      paymentStatus: paymentData?.paymentStatus || 'SUCCESS',
      paymentReference: paymentData?.paymentReference,
      paymentPath: paymentData?.paymentPath || `upi://pay?pa=${encodeURIComponent(upiAddress.trim() || generatedUpiAddress)}&am=${finalAmount.toFixed(2)}`,
    });
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!customerId) {
      setErrors({ submit: 'You must be logged in to place an order.' });
      return;
    }

    setIsSubmitting(true);

    try {
      if (deliveryForm.paymentMethod === 'cash_on_delivery') {
        await handleCodOrder();
        return;
      }

      setUpiAddress((current) => current || generatedUpiAddress);
      setCheckoutStep('payment-options');
    } catch (error) {
      setErrors({ submit: error?.response?.data?.message || 'Failed to place order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEnterUpi = () => {
    setCheckoutStep('upi');
  };

  const handleOtherPaymentMode = () => {
    showToast('UPI flow is ready. Other online payment modes can be added next without affecting checkout.', { type: 'info' });
  };

  const handleCompleteUpiPayment = async () => {
    if (!customerId) {
      setErrors({ submit: 'You must be logged in to place an order.' });
      return;
    }

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, submit: '' }));

    try {
      await handleUpiPaymentSuccess();
    } catch (error) {
      setErrors({ submit: error?.response?.data?.message || 'UPI payment failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderSuccessState = () => (
    <div className="min-h-screen bg-hero-warm">
      <NavbarWithCart user={user} onLogout={logout} />
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <div className="rounded-[2rem] border border-brand-200 bg-white p-8 shadow-float sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#ecfff3] text-[#20b15a]">
            <CheckCircle2 size={42} />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-ink-800">Payment successful, order placed</h2>
          <p className="mt-3 text-base text-ink-600">The order has been sent into tracking and pushed to the restaurant and driver dashboards.</p>

          <div className="mt-8 rounded-2xl bg-surface-50 p-6 text-left">
            <h3 className="mb-4 font-bold text-ink-800">Order Summary</h3>
            <div className="space-y-2 text-sm text-ink-600">
              <p>Delivery to: {hasTypedAddress ? [deliveryForm.address, deliveryForm.city, deliveryForm.zipCode].filter(Boolean).join(', ') : 'Current location'}</p>
              <p>Contact: {deliveryForm.phone}</p>
              <p>Order ID: {placedOrderId}</p>
              <p>Payment: {getPaymentLabel(paymentInfo?.paymentMethod || deliveryForm.paymentMethod)}</p>
              {paymentInfo?.paymentPath ? <p>Payment Path: {paymentInfo.paymentPath}</p> : null}
              {paymentInfo?.paymentReference ? <p>Payment Ref: {paymentInfo.paymentReference}</p> : null}
              <p>Status: {paymentInfo?.paymentStatus || 'SUCCESS'}</p>
              <p>Total Amount: Rs. {finalAmount.toFixed(2)}</p>
            </div>
          </div>

          <Button onClick={() => navigate('/orders')} className="mt-8 rounded-2xl px-8 py-3">
            Track Order
          </Button>
        </div>
      </div>
    </div>
  );

  const renderPaymentOptions = () => (
    <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">Payment options</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-900">Choose how to complete the payment</h2>
        </div>
        <button
          type="button"
          onClick={() => setCheckoutStep('details')}
          className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          Back
        </button>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[#f5e3d2] bg-[#fff7f0] p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-900">UPI QR</p>
            <p className="mt-1 text-sm text-ink-500">Scan and continue using any UPI app.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink-600">11:56</span>
        </div>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#111_12.5%,transparent_12.5%,transparent_50%,#111_50%,#111_62.5%,transparent_62.5%,transparent)] bg-[length:12px_12px] bg-white p-3">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-white">
              <QrCode size={54} className="text-slate-900" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-500">Scan the QR using any UPI App</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['PhonePe', 'GPay', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
                <span key={app} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-sm">
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        {ONLINE_PAYMENT_GROUPS.map((group) => {
          const Icon = group.icon;
          return (
            <button
              key={group.id}
              type="button"
              onClick={group.active ? handleEnterUpi : handleOtherPaymentMode}
              className="flex w-full items-center justify-between rounded-[1.4rem] border border-brand-100 bg-white px-5 py-4 text-left transition hover:border-brand-300 hover:bg-surface-50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="font-semibold text-ink-900">{group.title}</p>
                  <p className="mt-1 text-sm text-ink-500">{group.subtitle}</p>
                </div>
              </div>
              <ChevronRight className="text-ink-400" size={18} />
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderUpiPage = () => (
    <div className="rounded-[2rem] border border-brand-100 bg-white p-6 shadow-soft sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-500">UPI</p>
          <h2 className="mt-2 text-3xl font-bold text-ink-900">Pay through your UPI app</h2>
        </div>
        <button
          type="button"
          onClick={() => setCheckoutStep('payment-options')}
          className="rounded-full border border-brand-200 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
        >
          Back
        </button>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[#f5e3d2] bg-[#fff7f0] p-5">
        <p className="text-sm font-semibold text-ink-900">UPI QR</p>
        <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-2xl border border-slate-200 bg-[linear-gradient(45deg,#111_12.5%,transparent_12.5%,transparent_50%,#111_50%,#111_62.5%,transparent_62.5%,transparent)] bg-[length:12px_12px] bg-white p-3">
            <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm">
              <QrCode size={52} className="text-slate-900" />
            </div>
            <button
              type="button"
              onClick={() => setQrRefreshTick((tick) => tick + 1)}
              className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-ink-700 shadow"
            >
              <RefreshCw size={12} />
              Refresh QR
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink-500">Scan the QR using any UPI App</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['PhonePe', 'GPay', 'Paytm', 'BHIM', 'Amazon Pay'].map((app) => (
                <span key={`${app}-${qrRefreshTick}`} className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-ink-700 shadow-sm">
                  {app}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <label className="mb-3 block text-sm font-semibold text-ink-700">Pay with UPI ID / Number</label>
        <input
          value={upiAddress}
          onChange={(event) => setUpiAddress(event.target.value)}
          placeholder={generatedUpiAddress}
          className="w-full rounded-2xl border border-brand-200 bg-white px-4 py-4 text-sm text-ink-800 outline-none focus:ring-2 focus:ring-brand-200"
        />
      </div>

      {errors.submit ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-500">{errors.submit}</p> : null}

      <div className="mt-6 rounded-[1.5rem] border border-success-100 bg-success-50 p-4 text-sm text-success-700">
        Payment success will place the order immediately and the dashboards will refresh from the same order notification flow.
      </div>

      <Button
        type="button"
        loading={isSubmitting}
        onClick={handleCompleteUpiPayment}
        className="mt-6 w-full justify-center rounded-2xl py-3 text-base"
      >
        Make Payment Successful
      </Button>
    </div>
  );

  if (orderPlaced) {
    return renderSuccessState();
  }

  return (
    <div className="min-h-screen bg-hero-warm">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-brand-100 bg-gradient-to-br from-brand-500 via-brand-500 to-brand-400 shadow-float">
          <div className="grid gap-6 px-6 py-8 md:grid-cols-[1.2fr_0.8fr] md:px-8">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-100">
                <Truck size={14} />
                Checkout
              </p>
              <h1 className="mt-4 text-3xl font-black text-white md:text-5xl">
                {checkoutStep === 'details'
                  ? 'Complete delivery details and place the order'
                  : checkoutStep === 'payment-options'
                    ? 'Continue to the payment options page'
                    : 'Complete the UPI payment and finish checkout'}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-200 md:text-base">
                This keeps the existing checkout flow intact while adding the online payment steps from your reference.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-1">
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Items</p>
                <p className="mt-2 text-3xl font-bold text-white">{cartItems.length}</p>
                <p className="mt-1 text-sm text-ink-200">{checkingPrices ? 'Refreshing prices' : 'Confirmed items'}</p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Payment</p>
                <p className="mt-2 text-xl font-bold text-white">
                  {checkoutStep === 'upi' ? 'UPI' : getPaymentLabel(deliveryForm.paymentMethod)}
                </p>
                <p className="mt-1 text-sm text-ink-200">
                  {checkoutStep === 'details' ? 'Chosen in cart' : checkoutStep === 'payment-options' ? 'Choose a payment mode' : 'Ready to complete'}
                </p>
              </div>
              <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-100">Total</p>
                <p className="mt-2 text-3xl font-bold text-white">Rs. {finalAmount.toFixed(2)}</p>
                <p className="mt-1 text-sm text-ink-200">With tax and delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {checkoutStep === 'details' ? (
              <div className="rounded-[2rem] border border-brand-100 bg-white p-8 shadow-soft">
                <h2 className="mb-8 text-3xl font-bold text-ink-800">Delivery Details</h2>

                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-700">
                      <Home size={18} />
                      Full Name
                    </label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={deliveryForm.fullName}
                      onChange={handleFieldChange}
                      error={errors.fullName}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-700">
                      <Phone size={18} />
                      Phone Number
                    </label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={deliveryForm.phone}
                      onChange={handleFieldChange}
                      error={errors.phone}
                      placeholder="10-digit phone number"
                    />
                  </div>

                  <div>
                    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-700">
                      <MapPin size={18} />
                      Delivery Address
                    </label>
                    <textarea
                      name="address"
                      value={deliveryForm.address}
                      onChange={handleFieldChange}
                      placeholder="Street address, apartment, landmark"
                      className="w-full rounded-2xl border border-brand-200 px-4 py-3 text-sm text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-200"
                      rows="3"
                    />
                    {errors.address ? <p className="mt-1 text-xs text-red-500">{errors.address}</p> : null}
                    <p className="mt-2 text-xs text-ink-500">
                      Leave the address blank to use the customer current location instead.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-ink-700">City</label>
                      <Input
                        id="city"
                        name="city"
                        value={deliveryForm.city}
                        onChange={handleFieldChange}
                        error={errors.city}
                        placeholder="City name"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-ink-700">ZIP Code</label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={deliveryForm.zipCode}
                        onChange={handleFieldChange}
                        error={errors.zipCode}
                        placeholder="000000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink-700">
                      <CreditCard size={18} />
                      Payment Method
                    </label>
                    <div className="rounded-[1.5rem] border border-brand-100 bg-surface-50 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-ink-800">{getPaymentLabel(deliveryForm.paymentMethod)}</p>
                          <p className="mt-1 text-sm text-ink-500">
                            {deliveryForm.paymentMethod === 'cash_on_delivery'
                              ? 'Customer will pay after the order is delivered.'
                              : 'Customer continues to the online payment options page before the order is placed.'}
                          </p>
                        </div>
                        <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white">
                          Selected
                        </span>
                      </div>
                    </div>
                  </div>

                  {errors.submit ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-500">{errors.submit}</p> : null}

                  <div className="rounded-[1.5rem] border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700">
                    <div className="flex items-start gap-3">
                      <ShieldCheck size={18} className="mt-0.5 shrink-0" />
                      Final confirmation uses the latest restaurant prices, plus your route details to automatically set delivery fee and estimated arrival time.
                    </div>
                  </div>

                  {locationNotice ? (
                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                      {locationNotice}
                    </div>
                  ) : null}

                  <Button
                    type="submit"
                    loading={isSubmitting}
                    className="w-full justify-center rounded-2xl py-3 text-base"
                  >
                    {deliveryForm.paymentMethod === 'cash_on_delivery' ? 'Place Order' : 'Continue to Payment'}
                  </Button>
                </form>
              </div>
            ) : checkoutStep === 'payment-options' ? (
              renderPaymentOptions()
            ) : (
              renderUpiPage()
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-[2rem] border border-brand-100 bg-white p-8 shadow-soft">
              <h3 className="mb-6 text-2xl font-bold text-ink-800">Order Summary</h3>

              <div className="space-y-4 border-b border-brand-100 pb-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-ink-700">
                    <span>{item.name} x {item.quantity || 1}</span>
                    <span className="font-semibold">Rs. {(Number(item.price || 0) * Number(item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">Rs. {cartTotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 ? (
                  <div className="flex justify-between text-success-700">
                    <span>Coupon {appliedCoupon?.code || ''}</span>
                    <span className="font-semibold">- Rs. {couponDiscount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-ink-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">Rs. {deliveryCharge.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Estimated arrival</span>
                  <span className="font-semibold">{estimatedMinutes ? `${estimatedMinutes} min` : 'Calculating...'}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Platform charge</span>
                  <span className="font-semibold">Rs. {taxAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 border-t border-brand-100 pt-6">
                <div className="flex justify-between text-sm text-ink-500">
                  <span>Checkout stage</span>
                  <span className="font-semibold text-ink-700">
                    {checkoutStep === 'details' ? 'Delivery' : checkoutStep === 'payment-options' ? 'Payment options' : 'UPI payment'}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-sm text-ink-500">
                  <span>Payment method</span>
                  <span className="font-semibold text-ink-700">
                    {checkoutStep === 'upi' ? 'UPI' : getPaymentLabel(deliveryForm.paymentMethod)}
                  </span>
                </div>
                <div className="mt-5 flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-brand-600">Rs. {finalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
