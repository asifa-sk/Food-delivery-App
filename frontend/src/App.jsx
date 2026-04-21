import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/common/Toast';
import AuthPage from './features/auth/AuthPage';
import HomePageWithCategories from './pages/user/Home';
import CheckoutPage from './pages/CheckoutPage';
import RestaurantMenuPage from './pages/user/RestaurantDetails';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import VerifyOtpPage from './pages/VerifyOtpPage';
import EmailOtpLoginPage from './pages/EmailOtpLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import CartPage from './pages/user/Cart';
import OrdersPage from './pages/user/Orders';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import OffersPage from './pages/OffersPage';
import CustomerSignupPage from './pages/CustomerSignupPage';
import RestaurantSignupPage from './pages/RestaurantSignupPage';
import AdminDashboard from './pages/admin/Dashboard';
import RestaurantsAdminPage from './pages/admin/Restaurants';
import EditRestaurantPage from './pages/admin/EditRestaurant';
import AdminOrders from './pages/admin/Orders';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantFoodList from './pages/restaurant/FoodList';
import RestaurantOrders from './pages/restaurant/Orders';
import AddFoodPage from './pages/restaurant/AddFood';
import RestaurantReviews from './pages/restaurant/Reviews';
import RestaurantCustomers from './pages/restaurant/Customers';
import RestaurantReports from './pages/restaurant/Reports';
import RestaurantSettings from './pages/restaurant/Settings';
import './styles/index.css';

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const role = user?.role?.toString?.().toUpperCase?.();
  return allowedRoles.includes(role) ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <ToastProvider>
      <CartProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/email-otp-login" element={<EmailOtpLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/customer-signup" element={<CustomerSignupPage />} />
          <Route path="/restaurant-signup" element={<RestaurantSignupPage />} />
          <Route path="/auth" element={<AuthPage onAuthSuccess={() => { window.location.href = '/'; }} />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          <Route path="/menu/:restaurantId" element={<PrivateRoute><RestaurantMenuPage /></PrivateRoute>} />
          <Route path="/home" element={<PrivateRoute><HomePageWithCategories /></PrivateRoute>} />
          <Route path="/cart" element={<PrivateRoute><CartPage /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/favorites" element={<PrivateRoute><FavoritesPage /></PrivateRoute>} />
          <Route path="/offers" element={<PrivateRoute><OffersPage /></PrivateRoute>} />
          <Route path="/admin/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={['ADMIN']}><AdminDashboard /></RoleRoute></PrivateRoute>} />
          <Route path="/admin/restaurants" element={<PrivateRoute><RoleRoute allowedRoles={['ADMIN']}><RestaurantsAdminPage /></RoleRoute></PrivateRoute>} />
          <Route path="/admin/restaurants/:id/edit" element={<PrivateRoute><RoleRoute allowedRoles={['ADMIN']}><EditRestaurantPage /></RoleRoute></PrivateRoute>} />
          <Route path="/admin/orders" element={<PrivateRoute><RoleRoute allowedRoles={['ADMIN']}><AdminOrders /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/dashboard" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantDashboard /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/food-list" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantFoodList /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/orders" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantOrders /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/add-food" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><AddFoodPage /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/reviews" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantReviews /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/customers" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantCustomers /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/reports" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantReports /></RoleRoute></PrivateRoute>} />
          <Route path="/restaurant/settings" element={<PrivateRoute><RoleRoute allowedRoles={['RESTAURANT']}><RestaurantSettings /></RoleRoute></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </BrowserRouter>
      </CartProvider>
    </ToastProvider>
  );
}

export default App;
