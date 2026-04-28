import { BarChart3, ChefHat, ClipboardList, Home, Package, Settings, Star, Users } from 'lucide-react';

export const RESTAURANT_NAV_ITEMS = [
  { name: 'Dashboard', path: '/restaurant/dashboard', icon: Home },
  { name: 'Orders', path: '/restaurant/orders', icon: Package },
  { name: 'Menu', path: '/restaurant/food-list', icon: ChefHat },
  { name: 'Add Food', path: '/restaurant/add-food', icon: ClipboardList },
  { name: 'Reviews', path: '/restaurant/reviews', icon: Star },
  { name: 'Customers', path: '/restaurant/customers', icon: Users },
  { name: 'Reports', path: '/restaurant/reports', icon: BarChart3 },
  { name: 'Settings', path: '/restaurant/settings', icon: Settings },
];
