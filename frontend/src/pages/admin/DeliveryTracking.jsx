import { useEffect, useState } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import apiClient from '../../api/apiClient';

export default function DeliveryTracking() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const load = async () => {
    setError(null);
    try {
      const resp = await apiClient.get('/admin/delivery-tracking');
      setRows(resp.data || []);
    } catch (err) {
      console.error('Failed to load delivery tracking', err);
      // Try fallback to relative fetch for dev proxy or capture response info
      try {
        const r = await fetch('/api/admin/delivery-tracking');
        if (!r.ok) {
          setError(`Server returned ${r.status} ${r.statusText}`);
          return;
        }
        const data = await r.json();
        setRows(data || []);
      } catch (e) {
        setError(e.message || 'Network error');
      }
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <AdminLayout title="Delivery Tracking">
      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold mb-4">Delivery Tracking</h2>
        {error && (
          <div className="mb-4 text-red-600">Failed to load orders: {error}</div>
        )}
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500">
              <tr>
                <th className="pb-2">Order ID</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Restaurant</th>
                <th className="pb-2">Driver</th>
                <th className="pb-2">Status</th>
                <th className="pb-2">Delivered At</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.orderId} className="border-t">
                  <td className="py-3">{r.orderId}</td>
                  <td className="py-3">{r.customer}</td>
                  <td className="py-3">{r.restaurant}</td>
                  <td className="py-3">{r.driver}</td>
                  <td className="py-3">{String(r.status)}</td>
                  <td className="py-3">{r.deliveredAt ? new Date(r.deliveredAt).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
