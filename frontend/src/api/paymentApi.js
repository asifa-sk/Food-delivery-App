import apiClient from './apiClient';

export const processPayment = (payload) => apiClient.post('/payments/process', payload);
