import axios from 'axios';
import { store } from '../store';
import { logout, setMFAEnabled, setAuthenticated } from '../store/authSlice';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:8000',
  withCredentials: true,
});

// Add request interceptor to include CSRF token
api.interceptors.request.use(
  async (config) => {
    // For POST, PUT, PATCH, DELETE requests, try to include CSRF token
    if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(config.method)) {
      // Get CSRF token from cookie
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Update auth states for user details and login endpoints
    if (response.config.url.includes('/users/me')){
      store.dispatch(setAuthenticated(true));
      store.dispatch(setMFAEnabled(true));
    }
    if(response.config.url.includes('/users/auth/mfa/verify')){
      console.log('MFA verified');
      store.dispatch(setAuthenticated(true));
      store.dispatch(setMFAEnabled(true));
      sessionStorage.setItem('isMFAVerified', 'true');
    }
    if(response.config.url.includes('/users/auth/mfa/disable')){
      store.dispatch(setAuthenticated(true));
      store.dispatch(setMFAEnabled(false));
      sessionStorage.setItem('isMFAVerified', 'false');
    }
    if( response.config.url.includes('/users/auth/login')) {
      store.dispatch(setAuthenticated(true));
    }
    // Show success toast if message exists in response
    if (response.data?.message) {
      toast.success(response.data.message);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Any 401 means user needs to login again
      store.dispatch(logout());
    } 
    else if (error.response?.status === 403) {
      if (error.response.data?.requires_mfa_setup) {
        // User needs to setup MFA, but is still authenticated
        store.dispatch(setAuthenticated(true));
        store.dispatch(setMFAEnabled(false));
      }
    }
    else if (error.response?.status === 400) {
      if (error.response.data?.mfa_already_enabled) {
        store.dispatch(setAuthenticated(true));
        store.dispatch(setMFAEnabled(true));
        window.location.href = '/mfa';
      }
    }

    // Show error toast if error exists in response
    const errorMessage = error.response?.data?.error;
    errorMessage && toast.error(errorMessage);

    return Promise.reject(error);
  }
);

export default api;