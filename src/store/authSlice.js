import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    role: 'Guest User',
    isAuthenticated: false,
  },
  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.isAuthenticated = true;
    },
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.role = 'Guest User';
      state.isAuthenticated = false;
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    }
  },
});

export const authSliceActions = authSlice.actions;
export default authSlice.reducer;