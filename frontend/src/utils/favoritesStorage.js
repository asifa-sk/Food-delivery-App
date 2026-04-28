export function getFavoriteRestaurantsKey(userId) {
  return userId ? `favoriteRestaurants:${userId}` : 'favoriteRestaurants:guest';
}

export function getFavoriteItemsKey(userId) {
  return userId ? `favoriteItems:${userId}` : 'favoriteItems:guest';
}

export function readFavoriteIds(userId) {
  try {
    const stored = localStorage.getItem(getFavoriteRestaurantsKey(userId));
    const parsed = JSON.parse(stored || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFavoriteIds(userId, ids) {
  localStorage.setItem(getFavoriteRestaurantsKey(userId), JSON.stringify(Array.isArray(ids) ? ids : []));
}

export function readFavoriteItems(userId) {
  try {
    const stored = localStorage.getItem(getFavoriteItemsKey(userId));
    const parsed = JSON.parse(stored || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeFavoriteItems(userId, items) {
  localStorage.setItem(getFavoriteItemsKey(userId), JSON.stringify(Array.isArray(items) ? items : []));
}
