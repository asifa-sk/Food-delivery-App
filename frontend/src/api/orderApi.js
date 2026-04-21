import apiClient from './apiClient';

export const placeOrder = (payload) => apiClient.post('/orders', payload);

export const placeQuickOrder = (payload) => apiClient.post('/orders/quick', payload);

export const fetchCustomerOrders = (customerId) =>
  apiClient.get(`/orders/customer/${customerId}`);

export const fetchCustomerOrderSummary = (customerId) =>
  apiClient.get(`/orders/customer/${customerId}/summary`);

export const trackCustomerOrder = (customerId, orderId) =>
  apiClient.get(`/orders/customer/${customerId}/track/${orderId}`);

export const updateCustomerOrderStatus = (customerId, orderId, status) =>
  apiClient.patch(`/orders/customer/${customerId}/${orderId}/status`, { status });

export const submitFoodItemReview = (payload) => apiClient.post('/reviews', payload);

export const fetchCustomerReviews = (customerId) =>
  apiClient.get(`/reviews/customer/${customerId}`);
