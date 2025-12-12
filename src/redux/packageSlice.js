// src/redux/packageSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/axiosConfig';

// -------------------------
// Async thunks
// -------------------------

// Fetch public packages (Silver/Gold/Ruby) - GET /packages
export const fetchPackages = createAsyncThunk('package/fetchPackages', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/packages');
    // Expect backend returns array: [{ key, name, price, pv, pairIncome, capping, code }, ...]
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Failed to fetch packages');
  }
});

// Get single package details - GET /packages/:key
export const getPackageDetails = createAsyncThunk('package/getPackageDetails', async (packageKey, { rejectWithValue }) => {
  try {
    const res = await api.get(`/packages/${encodeURIComponent(packageKey)}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Failed to fetch package details');
  }
});

// Admin: generate EPINs - POST /admin/epin/generate
// payload: { quantity: number, package: 'Silver'|'Gold'|'Ruby', prefix?: string }
export const adminGenerateEpins = createAsyncThunk('package/adminGenerateEpins', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/admin/epin/generate', payload);
    return res.data; // expect generated epin list or summary
  } catch (err) {
    return rejectWithValue(err?.message || 'EPIN generation failed');
  }
});

// Admin: fetch all EPINs - GET /admin/epins?limit=..&page=..
export const fetchAdminEpins = createAsyncThunk('package/fetchAdminEpins', async (params = {}, { rejectWithValue }) => {
  try {
    const res = await api.get('/admin/epins', { params });
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Failed to fetch EPINs');
  }
});

// Public: fetch currently available EPINs for user (if backend exposes) - GET /user/epins
export const fetchPublicEpins = createAsyncThunk('package/fetchPublicEpins', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/user/epins');
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Failed to fetch user EPINs');
  }
});

// Buy package (frontend call to backend purchase) - POST /purchase
// payload: { package: 'Silver'|'Gold'|'Ruby', paymentPayload?: {} }
export const buyPackage = createAsyncThunk('package/buyPackage', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/purchase', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err?.message || 'Purchase failed');
  }
});

// -------------------------
// Initial state
// -------------------------
const initialState = {
  packages: [], // list of package objects
  selectedPackage: null, // details for selected package
  adminEpins: { items: [], total: 0, page: 1, limit: 50 },
  userEpins: [], // epins owned by logged-in user
  lastPurchase: null, // last purchase response
  loading: false,
  error: null,
};

// -------------------------
// Slice
// -------------------------
const packageSlice = createSlice({
  name: 'package',
  initialState,
  reducers: {
    clearPackageError(state) {
      state.error = null;
    },
    setSelectedPackage(state, action) {
      state.selectedPackage = action.payload;
    },
    clearSelectedPackage(state) {
      state.selectedPackage = null;
    },
    clearLastPurchase(state) {
      state.lastPurchase = null;
    },
  },
  extraReducers: (builder) => {
    // fetchPackages
    builder
      .addCase(fetchPackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPackages.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.packages = payload || [];
      })
      .addCase(fetchPackages.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Failed to load packages';
      });

    // getPackageDetails
    builder
      .addCase(getPackageDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPackageDetails.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.selectedPackage = payload;
      })
      .addCase(getPackageDetails.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Failed to fetch package details';
      });

    // adminGenerateEpins
    builder
      .addCase(adminGenerateEpins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(adminGenerateEpins.fulfilled, (state, { payload }) => {
        state.loading = false;
        // append generated EPINs to adminEpins.items if returned
        if (payload?.epins && Array.isArray(payload.epins)) {
          state.adminEpins.items = [...(state.adminEpins.items || []), ...payload.epins];
          state.adminEpins.total = (state.adminEpins.total || 0) + payload.epins.length;
        } else {
          // if backend returns summary
          state.adminEpins.lastGeneration = payload;
        }
      })
      .addCase(adminGenerateEpins.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'EPIN generation failed';
      });

    // fetchAdminEpins
    builder
      .addCase(fetchAdminEpins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminEpins.fulfilled, (state, { payload }) => {
        state.loading = false;
        // expect payload: { items: [...], total, page, limit }
        state.adminEpins.items = payload.items || payload || [];
        state.adminEpins.total = payload.total || (Array.isArray(payload) ? payload.length : 0);
        state.adminEpins.page = payload.page || state.adminEpins.page;
        state.adminEpins.limit = payload.limit || state.adminEpins.limit;
      })
      .addCase(fetchAdminEpins.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Failed to fetch admin EPINs';
      });

    // fetchPublicEpins
    builder
      .addCase(fetchPublicEpins.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicEpins.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.userEpins = payload || [];
      })
      .addCase(fetchPublicEpins.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Failed to fetch user EPINs';
      });

    // buyPackage
    builder
      .addCase(buyPackage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(buyPackage.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.lastPurchase = payload;
      })
      .addCase(buyPackage.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload || 'Purchase failed';
      });
  },
});

// -------------------------
// Exports
// -------------------------
export const { clearPackageError, setSelectedPackage, clearSelectedPackage, clearLastPurchase } = packageSlice.actions;

// Selectors
export const selectPackages = (state) => state.package.packages;
export const selectSelectedPackage = (state) => state.package.selectedPackage;
export const selectAdminEpins = (state) => state.package.adminEpins;
export const selectUserEpins = (state) => state.package.userEpins;
export const selectLastPurchase = (state) => state.package.lastPurchase;
export const selectPackageLoading = (state) => state.package.loading;
export const selectPackageError = (state) => state.package.error;

export default packageSlice.reducer;
