// src/redux/userSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api, {
  setAuthToken,
  clearAuthToken,
  initAuthFromStorage,
  loginAndStore,
} from '../api/axiosConfig';

// Initialize token from storage so axios instance can pick it up
initAuthFromStorage();

// -------------------------
// Async Thunks
// -------------------------

// payload: { emailOrPhone/email, password }
export const login = createAsyncThunk('user/login', async (payload, { rejectWithValue }) => {
  try {
    // loginAndStore will call /user/login and set token via setAuthToken
    const data = await loginAndStore(payload);
    // standardize response: expect { token, user }
    return { token: data.token, user: data.user || data };
  } catch (err) {
    return rejectWithValue(err?.message || 'Login failed');
  }
});

// payload: { name, email, phone, sponsorId, placementId, package, epin }
export const signup = createAsyncThunk('user/signup', async (payload, { rejectWithValue }) => {
  try {
    const data = await api.post('/user/signup', payload);
    return data.data || data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Signup failed');
  }
});

// logout: optionally call server to invalidate token
export const logout = createAsyncThunk('user/logout', async (doServerCall = false, { rejectWithValue }) => {
  try {
    if (doServerCall) {
      await api.post('/user/logout');
    }
  } catch (err) {
    // ignore server errors but continue to clear
  } finally {
    clearAuthToken();
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {}
  }
  return true;
});

// fetch current profile
export const fetchProfile = createAsyncThunk('user/fetchProfile', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/user/profile');
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Fetch profile failed');
  }
});

// update profile payload: { name, phone, email, kyc... }
export const updateProfile = createAsyncThunk('user/updateProfile', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.put('/user/profile', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Update profile failed');
  }
});

// fetch dashboard
export const fetchDashboard = createAsyncThunk('user/fetchDashboard', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/user/dashboard');
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Fetch dashboard failed');
  }
});

// fetch incomes
export const fetchIncomes = createAsyncThunk('user/fetchIncomes', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/user/incomes', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Fetch incomes failed');
  }
});

// fetch user's epins
export const fetchEpins = createAsyncThunk('user/fetchEpins', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/user/epins');
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Fetch EPINs failed');
  }
});

// purchase package: payload { package: 'Silver'|'Gold'|'Ruby', paymentPayload? }
export const purchasePackage = createAsyncThunk('user/purchasePackage', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/purchase', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Purchase failed');
  }
});

// activate EPIN: payload { epin, placementId?, package? }
export const activateEpin = createAsyncThunk('user/activateEpin', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/epin/activate', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'EPIN activation failed');
  }
});

// -------------------------
// Initial State
// -------------------------
const tokenFromStorage = (() => {
  try {
    return localStorage.getItem('token') || null;
  } catch (e) {
    return null;
  }
})();

const userFromStorage = (() => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
})();

const initialState = {
  user: userFromStorage,
  token: tokenFromStorage,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  dashboard: {
    pairs: 0,
    royalty: 0,
    levelIncome: 0,
    wallet: 0,
    pv: 0,
    bv: 0,
  },
  incomes: [],
  epins: [],
  loadingAction: null, // tracks current action
};

// If token exists in storage, ensure axios has it
if (tokenFromStorage) {
  setAuthToken(tokenFromStorage);
}

// -------------------------
// Slice
// -------------------------
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },
    setUserLocal(state, { payload }) {
      state.user = payload?.user || payload;
      state.token = payload?.token || state.token;
      // persist
      try {
        if (state.token) localStorage.setItem('token', state.token);
        if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
      } catch (e) {}
      if (payload?.token) setAuthToken(payload.token);
    },
    clearUserLocal(state) {
      state.user = null;
      state.token = null;
      state.dashboard = initialState.dashboard;
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } catch (e) {}
      clearAuthToken();
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.loadingAction = 'login';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, { payload }) => {
        state.status = 'succeeded';
        state.loadingAction = null;
        state.user = payload.user || null;
        state.token = payload.token || state.token;
        state.error = null;
        // persist
        try {
          if (state.token) localStorage.setItem('token', state.token);
          if (state.user) localStorage.setItem('user', JSON.stringify(state.user));
        } catch (e) {}
        if (payload.token) setAuthToken(payload.token);
      })
      .addCase(login.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.loadingAction = null;
        state.error = payload || 'Login failed';
      });

    // signup
    builder
      .addCase(signup.pending, (state) => {
        state.status = 'loading';
        state.loadingAction = 'signup';
        state.error = null;
      })
      .addCase(signup.fulfilled, (state) => {
        state.status = 'succeeded';
        state.loadingAction = null;
      })
      .addCase(signup.rejected, (state, { payload }) => {
        state.status = 'failed';
        state.loadingAction = null;
        state.error = payload || 'Signup failed';
      });

    // logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.status = 'idle';
        state.user = null;
        state.token = null;
        state.dashboard = initialState.dashboard;
        state.incomes = [];
        state.epins = [];
        state.error = null;
      });

    // fetchProfile
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loadingAction = 'fetchProfile';
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        state.user = payload;
        try {
          localStorage.setItem('user', JSON.stringify(payload));
        } catch (e) {}
      })
      .addCase(fetchProfile.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'Fetch profile failed';
      });

    // updateProfile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loadingAction = 'updateProfile';
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        state.user = payload;
        try {
          localStorage.setItem('user', JSON.stringify(payload));
        } catch (e) {}
      })
      .addCase(updateProfile.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'Update profile failed';
      });

    // fetchDashboard
    builder
      .addCase(fetchDashboard.pending, (state) => {
        state.loadingAction = 'fetchDashboard';
        state.error = null;
      })
      .addCase(fetchDashboard.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        state.dashboard = { ...state.dashboard, ...payload };
      })
      .addCase(fetchDashboard.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'Fetch dashboard failed';
      });

    // fetchIncomes
    builder
      .addCase(fetchIncomes.pending, (state) => {
        state.loadingAction = 'fetchIncomes';
        state.error = null;
      })
      .addCase(fetchIncomes.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        state.incomes = payload;
      })
      .addCase(fetchIncomes.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'Fetch incomes failed';
      });

    // fetchEpins
    builder
      .addCase(fetchEpins.pending, (state) => {
        state.loadingAction = 'fetchEpins';
        state.error = null;
      })
      .addCase(fetchEpins.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        state.epins = payload;
      })
      .addCase(fetchEpins.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'Fetch EPINs failed';
      });

    // purchasePackage
    builder
      .addCase(purchasePackage.pending, (state) => {
        state.loadingAction = 'purchasePackage';
        state.error = null;
      })
      .addCase(purchasePackage.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        // backend should return updated wallet/dashboard — optimistic refresh expectation
        // We keep payload as lastPurchase for UI display
        state.lastPurchase = payload;
      })
      .addCase(purchasePackage.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'Purchase failed';
      });

    // activateEpin
    builder
      .addCase(activateEpin.pending, (state) => {
        state.loadingAction = 'activateEpin';
        state.error = null;
      })
      .addCase(activateEpin.fulfilled, (state, { payload }) => {
        state.loadingAction = null;
        state.lastEpinActivation = payload;
      })
      .addCase(activateEpin.rejected, (state, { payload }) => {
        state.loadingAction = null;
        state.error = payload || 'EPIN activation failed';
      });
  },
});

// -------------------------
// Exports
// -------------------------
export const { clearError, setUserLocal, clearUserLocal } = userSlice.actions;

// Selectors
export const selectCurrentUser = (state) => state.user.user;
export const selectToken = (state) => state.user.token;
export const selectAuthStatus = (state) => state.user.status;
export const selectLoadingAction = (state) => state.user.loadingAction;
export const selectDashboard = (state) => state.user.dashboard;
export const selectIncomes = (state) => state.user.incomes;
export const selectEpins = (state) => state.user.epins;
export const selectUserError = (state) => state.user.error;

export default userSlice.reducer;
