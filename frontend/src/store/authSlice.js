import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isMFAEnabled: false,
  isMFAVerified: false,
  user: null,
  mfaSetupData: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setMFAEnabled: (state, action) => {
      state.isMFAEnabled = action.payload;
    },
    setMFAVerified: (state, action) => {
      state.isMFAVerified = action.payload;
    },
    setMFASetupData: (state, action) => {
      state.mfaSetupData = action.payload;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.isMFAEnabled = false;
      state.isMFAVerified = false;
      state.user = null;
      state.mfaSetupData = null;
    }
  }
});

export const { 
  setMFAEnabled, 
  setMFAVerified,
  setMFASetupData, 
  setUser, 
  logout 
} = authSlice.actions;

export default authSlice.reducer; 