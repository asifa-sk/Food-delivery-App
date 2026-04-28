import apiClient from './apiClient';

export function getPendingDrivers() {
  return apiClient.get('/admin/drivers/pending');
}

export function approveDriver(driverId) {
  return apiClient.post(`/admin/drivers/${driverId}/approve`);
}

export default { getPendingDrivers, approveDriver };
