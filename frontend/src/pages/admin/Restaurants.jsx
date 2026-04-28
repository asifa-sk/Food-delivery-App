import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const API = 'http://localhost:8081/api';

export default function RestaurantsAdminPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMsg, setActionMsg] = useState('');
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fetchRestaurants = async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/restaurants/all`);
      const data = await res.json();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch {
      setError('Failed to load restaurants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const handleAction = async (id, action) => {
    setActionMsg('');
    try {
      const res = await fetch(`${API}/restaurants/${id}/${action}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Action failed');
      setActionMsg(`Restaurant ${action}d successfully.`);
      fetchRestaurants();
    } catch {
      setActionMsg(`Failed to ${action} restaurant.`);
    }
  };

  const statusColor = (status) => {
    if (status === 'APPROVED') return 'bg-green-100 text-green-700';
    if (status === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-brand-100 text-brand-700';
  };

  return (
    <AdminLayout title="Restaurants">
      <div className='bg-white rounded-2xl shadow-sm border border-gray-100 p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>Restaurant Management</h2>
            <p className='text-gray-500 text-sm mt-1'>Approve or reject restaurants listed on the platform.</p>
          </div>
        </div>

        <div className='mb-4'>
          <input
            type='text'
            placeholder='Search by name or address...'
            value={search}
            onChange={e => setSearch(e.target.value)}
            className='w-full sm:w-80 rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400'
          />
        </div>

        {actionMsg && <div className='mb-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm'>{actionMsg}</div>}
        {error && <div className='mb-4 rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm'>{error}</div>}

        {loading ? (
          <div className='text-center py-16 text-gray-400'>
            <div className='w-8 h-8 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3'></div>
            Loading restaurants...
          </div>
        ) : restaurants.length === 0 ? (
          <div className='text-center py-16 text-gray-400'>No restaurants found.</div>
        ) : (
          <div className='overflow-x-auto'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='border-b border-gray-100'>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Image</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Name</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Address</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Contact</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Status</th>
                  <th className='pb-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-50'>
                {restaurants.filter(r => {
                  const q = search.toLowerCase();
                  return !q || r.name?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q);
                }).map(r => (
                  <tr key={r.restaurantId || r.id} className='hover:bg-gray-50 transition'>
                    <td className='py-3.5'>
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.name} className='w-14 h-10 object-cover rounded-lg border border-gray-100' onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        <div className='w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-xl'>🍽️</div>
                      )}
                    </td>
                    <td className='py-3.5 font-medium text-gray-900'>{r.name}</td>
                    <td className='py-3.5 text-gray-500 max-w-[200px] truncate'>{r.address}</td>
                    <td className='py-3.5 text-gray-500'>{r.contactNumber}</td>
                    <td className='py-3.5'>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(r.status)}`}>
                        {r.status || 'PENDING'}
                      </span>
                    </td>
                    <td className='py-3.5 flex gap-2'>
                      {r.status !== 'APPROVED' && (
                        <button onClick={() => handleAction(r.restaurantId || r.id, 'approve')} className='rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-semibold px-3 py-1.5 transition'>Approve</button>
                      )}
                      {r.status !== 'REJECTED' && (
                        <button onClick={() => handleAction(r.restaurantId || r.id, 'reject')} className='rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-3 py-1.5 transition'>Reject</button>
                      )}
                      <button onClick={() => navigate(`/admin/restaurants/${r.restaurantId || r.id}/edit`)} className='rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 transition'>Edit</button>
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
