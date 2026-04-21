import apiClient from './apiClient';

export function getUserFavorites(userId) {
  return apiClient.get(`/users/${userId}/favorites`).then((r) => r.data);
}

export function addFavorite(userId, restaurantId) {
  return apiClient.post(`/users/${userId}/favorites`, { restaurantId });
}

export function removeFavorite(userId, restaurantId) {
  return apiClient.delete(`/users/${userId}/favorites/${restaurantId}`);
}
