import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import { onOrderNotification } from '../../utils/notificationService';
import { formatOrderCurrency, formatOrderDateTime, normalizeOrder } from '../../utils/orderUtils';

const API = 'http://localhost:8081/api';

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'PREPARING', 'DRIVER_ASSIGNED', 'ARRIVED_AT_RESTAURANT', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'NEARBY', 'DELIVERED', 'CANCELLED'];

const statusColor = (status) => {
  switch (status) {
    case 'DELIVERED': return 'bg-green-100 text-green-700';
    case 'CANCELLED': return 'bg-red-100 text-red-700';
    case 'NEARBY': return 'bg-orange-100 text-orange-700';
    case 'OUT_FOR_DELIVERY': return 'bg-blue-100 text-blue-700';
    case 'PICKED_UP': return 'bg-sky-100 text-sky-700';
    case 'ARRIVED_AT_RESTAURANT': return 'bg-cyan-100 text-cyan-700';
    case 'DRIVER_ASSIGNED': return 'bg-brand-50 text-brand-700';
    case 'PREPARING': return 'bg-purple-100 text-purple-700';
    case 'CONFIRMED': return 'bg-indigo-100 text-indigo-700';
    default: return 'bg-brand-100 text-brand-700';
  }
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/orders/all`);
      const data = await res.json();
      setOrders(Array.isArray(data) ? data.map(normalizeOrder) : []);
    } catch {
      setError('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const off = onOrderNotification(() => {
      fetchOrders();
    });
    return off;
  }, []);

  useEffect(() => {
    const intervalId = setInterval(fetchOrders, 12000);
    return () => clearInterval(intervalId);
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      const updated = normalizeOrder(await res.json());
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, ...updated } : order)));
    } catch {
      alert('Failed to update order status.');
    } finally {
      setUpdating(null);
    }
  };

  return (
    <AdminLayout title="All Orders">
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Order Management</h2>
            <p className='text-gray-500 text-sm mt-1'>Monitor and update order statuses across the platform.</p>
          </div>
          <button onClick={fetchOrders} className='rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium px-4 py-2 transition flex items-center gap-2'>
            <svg className='w-4 h-4' fill='none' stroke='currentColor' strokeWidth={2} viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' /></svg>
            Refresh
          </button>
        </div>

        {error && <div className='mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm'>{error}</div>}

        {loading ? (
          <div className='text-center py-16 text-gray-400'>
            <div className='w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3'></div>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className='text-center py-16 text-gray-400'>No orders found.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100'>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Order ID</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Customer</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Restaurant</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Items</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Total</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Date</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Update</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {orders.map((order) => (
                  <tr key={order.id} className='hover:bg-gray-50 transition'>
                    <td className='py-3.5 font-semibold text-gray-700'>#{order.id}</td>
                    <td className='py-3.5 text-gray-600'>{order.customer?.name || order.customerName || '-'}</td>
                    <td className='py-3.5 text-gray-600'>{order.restaurant?.name || order.restaurantName || '-'}</td>
                    <td className='py-3.5 text-gray-500 max-w-[200px] text-xs'>
                      {order.items.length > 0
                        ? order.items.map((item) => `${item.foodItem?.name || item.name || 'Item'} x${item.quantity}`).join(', ')
                        : <span className='text-gray-300'>-</span>}
                    </td>
                    <td className='py-3.5 font-semibold text-gray-900'>{formatOrderCurrency(order.totalPrice)}</td>
                    <td className='py-3.5 text-gray-400 text-xs'>{formatOrderDateTime(order.createdAt)}</td>
                    <td className='py-3.5'>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(order.status)}`}>{order.statusLabel || order.status}</span>
                      {order.deliveredAt && <div className='mt-1 text-[11px] text-green-700'>Delivered: {formatOrderDateTime(order.deliveredAt)}</div>}
                    </td>
                    <td className='py-3.5'>
                      <select
                        value={order.status}
                        disabled={updating === order.id}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className='rounded-lg border border-gray-200 bg-gray-50 text-xs px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400 disabled:opacity-50'
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
