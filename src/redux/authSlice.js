import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // axios instance (baseURL + interceptors)

/**
 * authSlice.js
 * Frontend Redux slice for authentication & user session based on provided Hybrid-MLM plan.
 *
 * Responsibilities:
 * - Register / Login / Logout
 * - Load user profile (including package, PV/BV, ranks, wallet)
 * - Activate package using EPIN (epin redeem)
 * - Refresh / verify token
 * - Minimal optimistic updates for UI
 *
 * Usage:
 * - Place this file at src/redux/authSlice.js
 * - Ensure utils/api exports an Axios instance that attaches Authorization header from localStorage token.
 */

// ----------------------- Async Thunks -----------------------

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (formData, thunkAPI) => {
    try {
      const res = await api.post('/auth/register', formData);
      // expected: { token, user }
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, thunkAPI) => {
    try {
      const res = await api.post('/auth/login', credentials);
      // expected: { token, user }
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, thunkAPI) => {
    try {
      await api.post('/auth/logout');
      return true;
    } catch (err) {
      // even if server fails, we still clear local state
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/user/profile');
      return res.data; // expected: { user }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Activate a package using EPIN (epin redeem)
export const activatePackage = createAsyncThunk(
  'auth/activatePackage',
  async ({ epin, packageId }, thunkAPI) => {
    try {
      const res = await api.post('/user/activate-package', { epin, packageId });
      // expected: { success, user, activation }
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Verify token / refresh
export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/auth/verify');
      return res.data; // expected: { valid, user }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ----------------------- Initial State -----------------------
const initialState = {
  loading: false,
  isAuthenticated: false,
  token: localStorage.getItem('token') || null,
  user: null,
  error: null,

  // convenience small pieces for UI flows
  registering: false,
  loggingIn: false,
  activating: false,
};

// ----------------------- Slice -----------------------
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },

    setToken(state, action) {
      state.token = action.payload;
      state.isAuthenticated = !!action.payload;
      if (action.payload) localStorage.setItem('token', action.payload);
      else localStorage.removeItem('token');
    },

    updateLocalUser(state, action) {
      // Partial update to user object (e.g., wallet change)
      state.user = { ...(state.user || {}), ...action.payload };
    },
  },

  extraReducers: (builder) => {
    // register
    builder.addCase(registerUser.pending, (state) => {
      state.loading = true;
      state.registering = true;
      state.error = null;
    });
    builder.addCase(registerUser.fulfilled, (state, action) => {
      state.loading = false;
      state.registering = false;
      state.token = action.payload.token || null;
      state.user = action.payload.user || null;
      state.isAuthenticated = !!action.payload.token;
      if (action.payload.token) localStorage.setItem('token', action.payload.token);
    });
    builder.addCase(registerUser.rejected, (state, action) => {
      state.loading = false;
      state.registering = false;
      state.error = action.payload || 'Registration failed';
    });

    // login
    builder.addCase(loginUser.pending, (state) => {
      state.loading = true;
      state.loggingIn = true;
      state.error = null;
    });
    builder.addCase(loginUser.fulfilled, (state, action) => {
      state.loading = false;
      state.loggingIn = false;
      state.token = action.payload.token || null;
      state.user = action.payload.user || null;
      state.isAuthenticated = !!action.payload.token;
      if (action.payload.token) localStorage.setItem('token', action.payload.token);
    });
    builder.addCase(loginUser.rejected, (state, action) => {
      state.loading = false;
      state.loggingIn = false;
      state.error = action.payload || 'Login failed';
    });

    // logout
    builder.addCase(logoutUser.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(logoutUser.fulfilled, (state) => {
      state.loading = false;
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    });
    builder.addCase(logoutUser.rejected, (state, action) => {
      // still clear local state to keep UX smooth
      state.loading = false;
      state.token = null;
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      state.error = action.payload || null;
    });

    // fetch profile
    builder.addCase(fetchProfile.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.loading = false;
      state.user = action.payload.user || action.payload;
      state.isAuthenticated = true;
    });
    builder.addCase(fetchProfile.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to load profile';
      // if token invalid, clear
      if (action.payload && action.payload.status === 401) {
        state.token = null;
        state.isAuthenticated = false;
        localStorage.removeItem('token');
      }
    });

    // activate package via epin
    builder.addCase(activatePackage.pending, (state) => {
      state.activating = true;
      state.error = null;
    });
    builder.addCase(activatePackage.fulfilled, (state, action) => {
      state.activating = false;
      // server should return updated user
      if (action.payload && action.payload.user) state.user = action.payload.user;
    });
    builder.addCase(activatePackage.rejected, (state, action) => {
      state.activating = false;
      state.error = action.payload || 'Package activation failed';
    });

    // verify token
    builder.addCase(verifyToken.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(verifyToken.fulfilled, (state, action) => {
      state.loading = false;
      if (action.payload && action.payload.user) {
        state.user = action.payload.user;
        state.isAuthenticated = true;
      } else {
        state.isAuthenticated = !!state.token;
      }
    });
    builder.addCase(verifyToken.rejected, (state, action) => {
      state.loading = false;
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
      localStorage.removeItem('token');
      state.error = action.payload || null;
    });
  },
});

export const { clearAuthError, setToken, updateLocalUser } = authSlice.actions;
export default authSlice.reducer;
