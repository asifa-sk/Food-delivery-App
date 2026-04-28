import RestaurantList from '../features/restaurants/RestaurantList';
import Navbar from '../components/common/Navbar';
import { useAuth } from '../hooks/useAuth';

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-surface-50">
      <Navbar user={user} onLogout={logout} />

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-brand-500 to-brand-400 text-white py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Hungry? We've got you covered 🍔
          </h1>
          <p className="text-brand-100 text-lg">
            Order from the best restaurants near you
          </p>
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Restaurants near you</h2>
        <RestaurantList />
      </div>
    </div>
  );
}
