import apiClient from './apiClient';

// POST /auth/register — create a new user account
export const registerUser = (userData) =>
  apiClient.post('/auth/register', userData);

// POST /auth/verify-otp — verify email OTP after registration
export const verifyOtp = (email, otp) =>
  apiClient.post('/auth/verify-otp', { email, otp });

// POST /auth/login — authenticate and receive JWT token
export const loginUser = (credentials) =>
  apiClient.post('/auth/login', credentials);

// POST /auth/resend-otp — resend OTP to the given email
export const resendOTP = (email) =>
  apiClient.post('/auth/resend-otp', { email });

// POST /auth/login-otp/request — send OTP to email for passwordless login
export const requestLoginOtp = (email) =>
  apiClient.post('/auth/login-otp/request', { email });

// POST /auth/login-otp/verify — verify OTP and login
export const verifyLoginOtp = (email, otp) =>
  apiClient.post('/auth/login-otp/verify', { email, otp });

// POST /auth/forgot-password/request — send reset OTP to email
export const requestPasswordResetOtp = (email) =>
  apiClient.post('/auth/forgot-password/request', { email });

// POST /auth/forgot-password/reset — reset password using OTP
export const resetPasswordWithOtp = (email, otp, newPassword) =>
  apiClient.post('/auth/forgot-password/reset', { email, otp, newPassword });

export default apiClient;
