export function normalizeRole(role) {
  return role?.toString?.()?.toUpperCase?.() || 'CUSTOMER';
}

export function getHomeRouteForRole(role) {
  switch (normalizeRole(role)) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'RESTAURANT':
      return '/restaurant/dashboard';
    default:
      return '/home';
  }
}
