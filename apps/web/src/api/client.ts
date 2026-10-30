import axios from 'axios';

export const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isBrowser = typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

// Set or clear the authorization header dynamically
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (isBrowser) sessionStorage.setItem('roomly_token', token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    if (isBrowser) sessionStorage.removeItem('roomly_token');
  }
}

// Initialize with stored token if present
const existingToken = isBrowser ? sessionStorage.getItem('roomly_token') : null;
if (existingToken) {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${existingToken}`;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  }
);
