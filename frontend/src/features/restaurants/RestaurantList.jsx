import { useEffect, useState } from 'react';
import RestaurantCard from './RestaurantCard';
import Loader from '../../components/common/Loader';
import apiClient from '../../api/apiClient';

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient.get('/restaurants')
      .then(({ data }) => setRestaurants(data))
      .catch(() => setError('Failed to load restaurants. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader message="Finding restaurants near you..." />;

  if (error) return (
    <div className="text-center py-10 text-red-500">{error}</div>
  );

  if (!restaurants.length) return (
    <div className="text-center py-10 text-gray-500">No restaurants available at the moment.</div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
}
