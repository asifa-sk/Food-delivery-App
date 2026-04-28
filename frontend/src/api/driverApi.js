import apiClient from './apiClient';
import { normalizeOrder } from '../utils/orderUtils';

export function registerDriver(payload) {
  return apiClient.post('/drivers/register', payload);
}

export function loginDriver(payload) {
  return apiClient.post('/drivers/login', payload);
}

export function getAvailableOrders(driverId) {
  return apiClient.get(`/drivers/${driverId}/available`).then(res => {
    const data = Array.isArray(res.data) ? res.data.map(transformOrder) : [];
    return { ...res, data };
  });
}

export function getDriverOrders(driverId) {
  return apiClient.get(`/drivers/${driverId}/orders`).then(res => {
    const data = Array.isArray(res.data) ? res.data.map(transformOrder) : [];
    return { ...res, data };
  });
}

export function acceptOrder(driverId, orderId) {
  return apiClient.post(`/drivers/${driverId}/orders/${orderId}/accept`);
}

export function updateOrderStatus(driverId, orderId, status) {
  return apiClient.post(`/drivers/${driverId}/orders/${orderId}/status`, { status });
}

export function updateDriverLocation(driverId, orderId, latitude, longitude) {
  return apiClient.post(`/drivers/${driverId}/orders/${orderId}/location`, { latitude, longitude });
}

function transformOrder(o) {
  return normalizeOrder(o);
}
