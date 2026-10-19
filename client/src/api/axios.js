import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to requests if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses for auth errors (e.g. 401 expired token, 403 account deactivated)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      // Handle expired or invalid token
      if (status === 401) {
        localStorage.removeItem('tms_token');
        if (window.location.pathname !== '/login') {
          window.location.href = `/login?expired=true&message=${encodeURIComponent(
            data?.message || 'Your session has expired. Please sign in again.'
          )}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
