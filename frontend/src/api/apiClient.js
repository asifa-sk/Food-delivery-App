import axios from 'axios';

// Equivalent to process.env.REACT_APP_API_BASE_URL in CRA.
// Vite uses import.meta.env.VITE_* for exposed environment variables.
const apiClient = axios.create({
  // Default to relative `/api` so Vite dev proxy works and packaged app calls same origin.
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — log errors to console for easy debugging during development
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { config, response } = error;
    console.error(
      `[API Error] ${config?.method?.toUpperCase()} ${config?.url}`,
      response?.status ? `→ ${response.status} ${response.statusText}` : '→ Network/CORS error',
      response?.data || ''
    );
    return Promise.reject(error);
  }
);

export default apiClient;
