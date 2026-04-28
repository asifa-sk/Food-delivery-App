import apiClient from './apiClient';

export const fetchLiveTracking = (customerId, orderId) =>
  apiClient.get(`/orders/customer/${customerId}/track/${orderId}/live`);
