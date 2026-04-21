import { useState } from 'react';
import Button from '../../components/common/Button';
import { placeOrder } from '../../api/orderApi';

export default function Cart({ items, customerId, restaurantId, deliveryAddress: defaultAddress, onOrderPlaced }) {
  const [deliveryAddress, setDeliveryAddress] = useState(defaultAddress || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) { setError('Please enter a delivery address'); return; }
    setLoading(true);
    setError('');
    try {
      const payload = {
        customerId,
        restaurantId,
        deliveryAddress,
        items: items.map(({ foodItemId, quantity }) => ({ foodItemId, quantity })),
      };
      const { data } = await placeOrder(payload);
      onOrderPlaced?.(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h2 className="text-lg font-bold text-gray-800 mb-4">Your Cart</h2>

      {items.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">Your cart is empty</p>
      ) : (
        <ul className="divide-y divide-gray-100 mb-4">
          {items.map((item) => (
            <li key={item.foodItemId} className="flex justify-between py-2 text-sm">
              <span className="text-gray-700">{item.name} × {item.quantity}</span>
              <span className="font-medium text-gray-800">₹{(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t pt-3 mb-4 flex justify-between font-semibold text-gray-800">
        <span>Total</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <input
        type="text"
        placeholder="Delivery address"
        value={deliveryAddress}
        onChange={(e) => setDeliveryAddress(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-orange-300"
      />

      {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

      <Button onClick={handlePlaceOrder} loading={loading} disabled={!items.length} className="w-full justify-center">
        Place Order
      </Button>
    </div>
  );
}
