import { useState, useCallback } from 'react';
import { loginUser, registerUser, verifyOtp } from '../api/authApi';

export function useAuth() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await loginUser(credentials);
      localStorage.setItem('token', data.token);
      const userPayload = data.user || {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem('user', JSON.stringify(userPayload));
      setUser(userPayload);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await registerUser(userData);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmOTP = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await verifyOtp(payload.email, payload.otp);
      localStorage.setItem('token', data.token);
      const userPayload = data.user || {
        id: data.userId,
        name: data.name,
        email: data.email,
        role: data.role,
      };
      localStorage.setItem('user', JSON.stringify(userPayload));
      setUser(userPayload);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return { user, loading, error, login, register, confirmOTP, logout };
}
