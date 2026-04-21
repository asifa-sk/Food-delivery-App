import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavbarWithCart from '../components/common/NavbarWithCart';
import CartSidebar from '../components/common/CartSidebar';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { placeOrder } from '../api/orderApi';
import { MapPin, Phone, Home, CreditCard } from 'lucide-react';

const parseCustomerIdFromToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('-');
  if (parts.length < 4) return null;
  const maybeId = Number(parts[2]);
  return Number.isFinite(maybeId) ? maybeId : null;
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cartItems, cartTotal, discountedTotal, couponDiscount, appliedCoupon, clearCart } = useCart();
  const [deliveryForm, setDeliveryForm] = useState({
    fullName: user?.email?.split('@')[0] || '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'cash',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState('');

  const customerId = user?.id || parseCustomerIdFromToken(localStorage.getItem('token'));

  if (cartItems.length === 0 && !orderPlaced) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavbarWithCart user={user} onLogout={logout} />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Your cart is empty</h2>
          <Button onClick={() => navigate('/')} variant="primary">
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
    if (!deliveryForm.address.trim()) newErrors.address = 'Address is required';
    if (!deliveryForm.city.trim()) newErrors.city = 'City is required';
    if (!deliveryForm.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    return newErrors;
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setDeliveryForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
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
      const restaurantId = cartItems[0]?.restaurantId;
      const deliveryAddress = `${deliveryForm.address}, ${deliveryForm.city}, ${deliveryForm.zipCode}`;
      const finalAmount = Number((discountedTotal + 30 + discountedTotal * 0.05).toFixed(2));

      const { data } = await placeOrder({
        customerId,
        restaurantId,
        deliveryAddress,
        totalPrice: finalAmount,
        items: cartItems.map(i => ({ foodItemId: i.id, quantity: i.quantity || 1 })),
      });

      setPlacedOrderId(`FO-${data.id}`);
      setOrderPlaced(true);
      clearCart();
    } catch (error) {
      setErrors({ submit: 'Failed to place order. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
        <NavbarWithCart user={user} onLogout={logout} />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="bg-white rounded-3xl p-12 shadow-lg border-2 border-green-500">
            <div className="text-6xl mb-6">✅</div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Order Placed Successfully!</h2>
            <p className="text-gray-600 text-lg mb-2">Thank you for ordering from Foodyy.</p>
            <p className="text-gray-600 mb-8">Your order will be delivered soon.</p>

            <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p>📍 Delivery to: {deliveryForm.address}, {deliveryForm.city}</p>
                <p>📞 Contact: {deliveryForm.phone}</p>
                <p>🧾 Order ID: {placedOrderId}</p>
                <p>💰 Total Amount: ₹{(discountedTotal + 30 + discountedTotal * 0.05).toFixed(2)}</p>
              </div>
            </div>

            <Button onClick={() => navigate('/')} className="rounded-2xl px-8 py-3">
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <NavbarWithCart user={user} onLogout={logout} />
      <CartSidebar />

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-8">Delivery Details</h2>

              <form onSubmit={handleSubmitOrder} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Home size={18} />
                    Full Name
                  </label>
                  <Input
                    id="fullName"
                    value={deliveryForm.fullName}
                    onChange={handleFieldChange}
                    error={errors.fullName}
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone size={18} />
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={deliveryForm.phone}
                    onChange={handleFieldChange}
                    error={errors.phone}
                    placeholder="10-digit phone number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin size={18} />
                    Delivery Address
                  </label>
                  <textarea
                    name="address"
                    value={deliveryForm.address}
                    onChange={handleFieldChange}
                    placeholder="Street address, apt, etc."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    rows="3"
                  />
                  {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">City</label>
                    <Input
                      id="city"
                      value={deliveryForm.city}
                      onChange={handleFieldChange}
                      error={errors.city}
                      placeholder="City name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">ZIP Code</label>
                    <Input
                      id="zipCode"
                      value={deliveryForm.zipCode}
                      onChange={handleFieldChange}
                      error={errors.zipCode}
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                    <CreditCard size={18} />
                    Payment Method
                  </label>
                  <div className="space-y-3">
                    {['cash', 'card', 'upi'].map((method) => (
                      <label key={method} className="flex items-center p-3 border-2 rounded-xl cursor-pointer transition" style={{borderColor: deliveryForm.paymentMethod === method ? '#f97316' : '#e5e7eb'}}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value={method}
                          checked={deliveryForm.paymentMethod === method}
                          onChange={handleFieldChange}
                          className="w-5 h-5"
                        />
                        <span className="ml-3 font-semibold text-gray-700 capitalize">
                          {method === 'cash' ? '💵 Cash on Delivery' : method === 'card' ? '💳 Credit/Debit Card' : '📱 UPI'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {errors.submit && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{errors.submit}</p>}

                <Button
                  type="submit"
                  loading={isSubmitting}
                  className="w-full justify-center rounded-2xl py-3 text-base"
                >
                  Place Order
                </Button>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-lg p-8 sticky top-24">
              <h3 className="text-2xl font-bold text-gray-800 mb-6">Order Summary</h3>

              <div className="space-y-4 pb-6 border-b-2 border-gray-200">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm text-gray-700">
                    <span>{item.name} x {item.quantity}</span>
                    <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold">₹{cartTotal.toFixed(2)}</span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Coupon {appliedCoupon?.code || ''}</span>
                    <span className="font-semibold">-₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">₹30.00</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-semibold">₹{(discountedTotal * 0.05).toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t-2 border-gray-200">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span className="text-orange-500">₹{(discountedTotal + 30 + discountedTotal * 0.05).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
