import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Function to get CSRF token from cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor to add session ID and CSRF token
api.interceptors.request.use((config) => {
  // Debug: log the full URL being called
  console.log('API Request:', config.method.toUpperCase(), config.baseURL + config.url);

  const sessionId = localStorage.getItem('sessionId');
  if (sessionId && sessionId !== 'DEV_FAKE_SESSION') {
    // Send session ID as header (backend checks X-Session-ID or cookies)
    config.headers['X-Session-ID'] = sessionId;
  }

  // Add CSRF token for non-safe methods (POST, PUT, DELETE, PATCH)
  if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
  }

  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, '- Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.config?.url, error.response?.status, error.message);

    const status = error.response?.status;

    // Handle authentication failures and rate limiting
    if (status === 401) {
      // Session expired or invalid credentials - force login
      localStorage.removeItem('sessionId');
      document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    } else if (status === 403) {
      // Forbidden: keep session but redirect to unauthorized page
      window.location.href = '/unauthorized';
    } else if (status === 429) {
      // Rate limited by AXES - show alert and redirect to login
      alert('Too many failed requests. Please wait a moment and try logging in again.');
      localStorage.removeItem('sessionId');
      document.cookie = 'session_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;
