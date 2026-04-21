import { Link, useNavigate } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-orange-500">
          🍔 Foodyy
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <span className="text-gray-600 text-sm">Hi, {user.name}</span>
              <Link to="/orders" className="text-gray-700 hover:text-orange-500 text-sm font-medium">
                My Orders
              </Link>
              <button
                onClick={handleLogout}
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-1.5 rounded-full transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-700 hover:text-orange-500 text-sm font-medium">
                Login
              </Link>
              <Link
                to="/register"
                className="bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-1.5 rounded-full transition"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
