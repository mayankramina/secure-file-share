import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import fileReducer from './fileSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    files: fileReducer,
  },
});
