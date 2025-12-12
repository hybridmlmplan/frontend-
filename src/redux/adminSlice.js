import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../utils/api'; // <-- your axios instance

/**
 * ADMIN SLICE BASED ON FINAL MLM PLAN
 * Handles:
 * - Packages
 * - Ranks
 * - Royalty & Fund Settings
 * - PV/BV Config
 * - EPIN Management
 * - Session Engine Controls
 */

// ======================= ASYNC THUNKS =======================

// Fetch all admin master data
export const fetchAdminDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/admin/dashboard');
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update PV/BV Config
export const updatePVConfig = createAsyncThunk(
  'admin/updatePVConfig',
  async (payload, thunkAPI) => {
    try {
      const res = await api.post('/admin/pv-config', payload);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Generate EPIN
export const generateEPIN = createAsyncThunk(
  'admin/generateEPIN',
  async (payload, thunkAPI) => {
    try {
      const res = await api.post('/admin/epin-generate', payload);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Toggle Token (LIVE / TEST)
export const toggleTokenMode = createAsyncThunk(
  'admin/toggleTokenMode',
  async (mode, thunkAPI) => {
    try {
      const res = await api.post('/admin/token-mode', { mode });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ======================= SLICE =======================
const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    loading: false,
    error: null,

    // MASTER DATA
    packages: [], // Silver/Gold/Ruby configs
    ranks: [],
    royalty: {},
    funds: {},
    pvConfig: {},
    sessionConfig: {
      totalSessions: 8,
      sessionLength: '2h 15m',
      timings: [
        '06:00–08:15', '08:15–10:30', '10:30–12:45',
        '12:45–15:00', '15:00–17:15', '17:15–19:30',
        '19:30–21:45', '21:45–00:00'
      ]
    },

    tokenMode: 'OFF', // TEST = OFF, LIVE = ON
    epins: [],
  },

  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // ======================= FETCH DASHBOARD =======================
    builder.addCase(fetchAdminDashboard.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(fetchAdminDashboard.fulfilled, (state, action) => {
      state.loading = false;
      state.packages = action.payload.packages || [];
      state.ranks = action.payload.ranks || [];
      state.royalty = action.payload.royalty || {};
      state.funds = action.payload.funds || {};
      state.pvConfig = action.payload.pvConfig || {};
      state.sessionConfig = action.payload.sessionConfig || state.sessionConfig;
      state.tokenMode = action.payload.tokenMode || 'OFF';
      state.epins = action.payload.epins || [];
    });
    builder.addCase(fetchAdminDashboard.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ======================= UPDATE PV CONFIG =======================
    builder.addCase(updatePVConfig.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updatePVConfig.fulfilled, (state, action) => {
      state.loading = false;
      state.pvConfig = action.payload;
    });
    builder.addCase(updatePVConfig.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ======================= GENERATE EPIN =======================
    builder.addCase(generateEPIN.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(generateEPIN.fulfilled, (state, action) => {
      state.loading = false;
      state.epins = [...state.epins, ...action.payload];
    });
    builder.addCase(generateEPIN.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    // ======================= TOGGLE TOKEN MODE =======================
    builder.addCase(toggleTokenMode.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(toggleTokenMode.fulfilled, (state, action) => {
      state.loading = false;
      state.tokenMode = action.payload.mode;
    });
    builder.addCase(toggleTokenMode.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
  },
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
