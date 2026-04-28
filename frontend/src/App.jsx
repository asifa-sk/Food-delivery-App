import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/common/Toast';
import { readStoredJson } from './utils/storage';
import './styles/index.css';

const AuthPage = lazy(() => import('./features/auth/AuthPage'));
const HomePageWithCategories = lazy(() => import('./pages/user/Home'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const RestaurantMenuPage = lazy(() => import('./pages/user/RestaurantDetails'));
const StableLoginPage = lazy(() => import('./pages/StableLoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/Register'));
const VerifyOtpPage = lazy(() => import('./pages/VerifyOtpPage'));
const EmailOtpLoginPage = lazy(() => import('./pages/EmailOtpLoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const CartPage = lazy(() => import('./pages/user/Cart'));
const OrdersPage = lazy(() => import('./pages/user/Orders'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const OffersPage = lazy(() => import('./pages/OffersPage'));
const CustomerSignupPage = lazy(() => import('./pages/CustomerSignupPage'));
const RestaurantSignupPage = lazy(() => import('./pages/RestaurantSignupPage'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const RestaurantsAdminPage = lazy(() => import('./pages/admin/Restaurants'));
const EditRestaurantPage = lazy(() => import('./pages/admin/EditRestaurant'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const DeliveryTracking = lazy(() => import('./pages/admin/DeliveryTracking'));
const AdminDrivers = lazy(() => import('./pages/admin/Drivers'));
const RestaurantDashboard = lazy(() => import('./pages/restaurant/Dashboard'));
const RestaurantFoodList = lazy(() => import('./pages/restaurant/FoodList'));
const RestaurantOrders = lazy(() => import('./pages/restaurant/Orders'));
const AddFoodPage = lazy(() => import('./pages/restaurant/AddFood'));
const RestaurantReviews = lazy(() => import('./pages/restaurant/Reviews'));
const RestaurantCustomers = lazy(() => import('./pages/restaurant/Customers'));
const RestaurantReports = lazy(() => import('./pages/restaurant/Reports'));
const RestaurantSettings = lazy(() => import('./pages/restaurant/Settings'));
const DriverSignupPage = lazy(() => import('./pages/DriverSignupPage'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const DriverOrders = lazy(() => import('./pages/driver/Orders'));
const DriverProfile = lazy(() => import('./pages/driver/Profile'));
const DriverSettings = lazy(() => import('./pages/driver/Settings'));

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function RoleRoute({ children, allowedRoles }) {
  const user = readStoredJson('user', null);
  const role = user?.role?.toString?.().toUpperCase?.();
  return allowedRoles.includes(role) ? children : <Navigate to="/login" replace />;
}

function PrivateDriverRoute({ children }) {
  const driver = readStoredJson('driver', null);
  return driver?.id ? children : <Navigate to="/driver/login" replace />;
}

function AppProviders({ children }) {
  return (
    <ToastProvider>
      <CartProvider>
        {children}
      </CartProvider>
    </ToastProvider>
  );
}

function ProtectedCustomerLayout() {
  return (
    <PrivateRoute>
      <AppProviders>
        <Outlet />
      </AppProviders>
    </PrivateRoute>
  );
}

function ProtectedRoleLayout({ allowedRoles }) {
  return (
    <PrivateRoute>
      <RoleRoute allowedRoles={allowedRoles}>
        <AppProviders>
          <Outlet />
        </AppProviders>
      </RoleRoute>
    </PrivateRoute>
  );
}

function ProtectedDriverLayout() {
  return (
    <PrivateDriverRoute>
      <ToastProvider>
        <Outlet />
      </ToastProvider>
    </PrivateDriverRoute>
  );
}

function RouteFallback() {
  return (
    <div className="min-h-screen bg-hero-warm px-6 py-12">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-brand-100 bg-white p-8 text-center shadow-float">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-lg font-black text-white">
          F
        </div>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-brand-600">Foodyy</p>
        <h1 className="mt-3 text-3xl font-black text-slate-900">Loading page</h1>
        <p className="mt-2 text-sm text-slate-500">Preparing the screen...</p>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<StableLoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/email-otp-login" element={<EmailOtpLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/customer-signup" element={<CustomerSignupPage />} />
        <Route path="/restaurant-signup" element={<RestaurantSignupPage />} />
        <Route path="/auth" element={<AuthPage onAuthSuccess={() => { window.location.href = '/'; }} />} />
        <Route path="/driver/signup" element={<DriverSignupPage />} />
        <Route path="/driver/login" element={<StableLoginPage />} />

        <Route element={<ProtectedCustomerLayout />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/menu/:restaurantId" element={<RestaurantMenuPage />} />
          <Route path="/home" element={<HomePageWithCategories />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/offers" element={<OffersPage />} />
        </Route>

        <Route element={<ProtectedRoleLayout allowedRoles={['ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/restaurants" element={<RestaurantsAdminPage />} />
          <Route path="/admin/restaurants/:id/edit" element={<EditRestaurantPage />} />
          <Route path="/admin/drivers" element={<AdminDrivers />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/delivery-tracking" element={<DeliveryTracking />} />
        </Route>

        <Route element={<ProtectedRoleLayout allowedRoles={['RESTAURANT']} />}>
          <Route path="/restaurant/dashboard" element={<RestaurantDashboard />} />
          <Route path="/restaurant/food-list" element={<RestaurantFoodList />} />
          <Route path="/restaurant/orders" element={<RestaurantOrders />} />
          <Route path="/restaurant/add-food" element={<AddFoodPage />} />
          <Route path="/restaurant/reviews" element={<RestaurantReviews />} />
          <Route path="/restaurant/customers" element={<RestaurantCustomers />} />
          <Route path="/restaurant/reports" element={<RestaurantReports />} />
          <Route path="/restaurant/settings" element={<RestaurantSettings />} />
        </Route>

        <Route element={<ProtectedDriverLayout />}>
          <Route path="/driver/dashboard" element={<DriverDashboard />} />
          <Route path="/driver/orders" element={<DriverOrders />} />
          <Route path="/driver/profile" element={<DriverProfile />} />
          <Route path="/driver/settings" element={<DriverSettings />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
