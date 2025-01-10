import axios from 'axios';
import { store } from '../store';
import { logout, setMFAEnabled } from '../store/authSlice';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:8000',
  withCredentials: true
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Check for MFA headers or status in response
    const mfaEnabled = response.headers['x-mfa-enabled'] === 'true';
    store.dispatch(setMFAEnabled(mfaEnabled));

    // Show success toast if message exists in response
    if (response.data?.message) {
      toast.success(response.data.message);
    }

    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (error.response.data?.login_expired) {
        store.dispatch(logout());
        window.location.href = '/login';
      }
    }

    // Show error toast if error exists in response
    const errorMessage = error.response?.data?.error || 'An unexpected error occurred';
    toast.error(errorMessage);

    return Promise.reject(error);
  }
);

export default api; 