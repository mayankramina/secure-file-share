import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api';

export const fetchUserDetails = createAsyncThunk(
  'auth/fetchUserDetails',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data);
    }
  }
);

const initialState = {
  isAuthenticated: false,
  isMFAEnabled: false,
  user: null,
  loading: true,
  error: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated: (state, action) => {
      state.isAuthenticated = action.payload;
    },
    setMFAEnabled: (state, action) => {
      state.isMFAEnabled = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.isMFAEnabled = false;
      state.isAuthenticated = false;
      sessionStorage.setItem('isMFAVerified', 'false');
      state.user = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserDetails.rejected, (state, action) => {
        state.loading = false;
        // Don't modify auth states here as they're handled by interceptors
        state.user = null;
      });
  }
});

export const { 
  setAuthenticated,
  setMFAEnabled,
  setUser,
  logout
} = authSlice.actions;

export default authSlice.reducer; 