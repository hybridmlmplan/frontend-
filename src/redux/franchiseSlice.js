import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api'; // axios instance with baseURL + auth interceptors

/**
 * src/redux/franchiseSlice.js
 * Redux slice to manage franchise-related state for the Hybrid-MLM frontend.
 *
 * Responsibilities:
 * - Load franchise list (admin)
 * - Create / Update / Delete franchise
 * - Track franchise stock / sales / BV/PV contribution
 * - Support assigning franchise to user and calculating commissions (frontend flags only)
 *
 * Expected backend endpoints (convention used here):
 * GET  /franchise            -> list franchises (admin)
 * POST /franchise            -> create franchise
 * GET  /franchise/:id        -> get single franchise
 * PUT  /franchise/:id        -> update franchise
 * DELETE /franchise/:id      -> delete franchise
 * GET  /franchise/:id/sales  -> get sales report for franchise
 * POST /franchise/:id/sell   -> record sale (creates BV/PV, updates stock)
 */

// ---------------------- Async Thunks ----------------------

export const fetchFranchises = createAsyncThunk(
  'franchise/fetchFranchises',
  async (_, thunkAPI) => {
    try {
      const res = await api.get('/franchise');
      return res.data; // expected: { franchises: [...] }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchFranchiseById = createAsyncThunk(
  'franchise/fetchFranchiseById',
  async (id, thunkAPI) => {
    try {
      const res = await api.get(`/franchise/${id}`);
      return res.data; // expected: { franchise }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const createFranchise = createAsyncThunk(
  'franchise/createFranchise',
  async (payload, thunkAPI) => {
    // payload: { name, location, minSellingPrice, stock, ownerUserId?, config? }
    try {
      const res = await api.post('/franchise', payload);
      return res.data; // expected: { franchise }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updateFranchise = createAsyncThunk(
  'franchise/updateFranchise',
  async ({ id, updates }, thunkAPI) => {
    try {
      const res = await api.put(`/franchise/${id}`, updates);
      return res.data; // expected: { franchise }
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const deleteFranchise = createAsyncThunk(
  'franchise/deleteFranchise',
  async (id, thunkAPI) => {
    try {
      const res = await api.delete(`/franchise/${id}`);
      return { id, ...res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchFranchiseSales = createAsyncThunk(
  'franchise/fetchFranchiseSales',
  async ({ id, params }, thunkAPI) => {
    // params optional: { from, to, page }
    try {
      const res = await api.get(`/franchise/${id}/sales`, { params });
      return { id, sales: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const recordFranchiseSale = createAsyncThunk(
  'franchise/recordFranchiseSale',
  async ({ id, sale }, thunkAPI) => {
    // sale: { productId, qty, sellingPrice, buyerUserId }
    try {
      const res = await api.post(`/franchise/${id}/sell`, sale);
      return { id, sale: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

// ---------------------- Initial State ----------------------
const initialState = {
  loading: false,
  franchises: [], // list of franchise objects
  byId: {}, // normalized map id->franchise
  selected: null,
  salesByFranchise: {}, // id -> { records: [], meta }
  error: null,
};

// ---------------------- Slice ----------------------
const franchiseSlice = createSlice({
  name: 'franchise',
  initialState,
  reducers: {
    clearFranchiseError(state) {
      state.error = null;
    },
    selectFranchise(state, action) {
      state.selected = action.payload;
    },
    clearSelectedFranchise(state) {
      state.selected = null;
    },
    // local optimistic update to stock
    adjustFranchiseStock(state, action) {
      // payload: { id, delta }
      const { id, delta } = action.payload;
      const f = state.byId[id];
      if (f) {
        f.stock = (f.stock || 0) + delta;
        // update list as well
        state.franchises = state.franchises.map((x) => (x.id === id ? f : x));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch list
      .addCase(fetchFranchises.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFranchises.fulfilled, (state, action) => {
        state.loading = false;
        const list = action.payload.franchises || action.payload || [];
        state.franchises = list;
        state.byId = list.reduce((acc, f) => ({ ...acc, [f.id]: f }), {});
      })
      .addCase(fetchFranchises.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load franchises';
      })

      // fetch by id
      .addCase(fetchFranchiseById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFranchiseById.fulfilled, (state, action) => {
        state.loading = false;
        const f = action.payload.franchise || action.payload;
        if (f) {
          state.byId[f.id] = f;
          // keep franchises array in sync (replace if exists)
          const idx = state.franchises.findIndex((x) => x.id === f.id);
          if (idx >= 0) state.franchises[idx] = f;
          else state.franchises.push(f);
          state.selected = f.id;
        }
      })
      .addCase(fetchFranchiseById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load franchise';
      })

      // create
      .addCase(createFranchise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createFranchise.fulfilled, (state, action) => {
        state.loading = false;
        const f = action.payload.franchise || action.payload;
        if (f) {
          state.franchises.push(f);
          state.byId[f.id] = f;
        }
      })
      .addCase(createFranchise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create franchise';
      })

      // update
      .addCase(updateFranchise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateFranchise.fulfilled, (state, action) => {
        state.loading = false;
        const f = action.payload.franchise || action.payload;
        if (f) {
          state.byId[f.id] = f;
          state.franchises = state.franchises.map((x) => (x.id === f.id ? f : x));
        }
      })
      .addCase(updateFranchise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update franchise';
      })

      // delete
      .addCase(deleteFranchise.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteFranchise.fulfilled, (state, action) => {
        state.loading = false;
        const { id } = action.payload;
        state.franchises = state.franchises.filter((x) => x.id !== id);
        delete state.byId[id];
        if (state.selected === id) state.selected = null;
      })
      .addCase(deleteFranchise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to delete franchise';
      })

      // fetch sales
      .addCase(fetchFranchiseSales.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFranchiseSales.fulfilled, (state, action) => {
        state.loading = false;
        const { id, sales } = action.payload;
        state.salesByFranchise[id] = sales;
      })
      .addCase(fetchFranchiseSales.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load franchise sales';
      })

      // record sale
      .addCase(recordFranchiseSale.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordFranchiseSale.fulfilled, (state, action) => {
        state.loading = false;
        const { id, sale } = action.payload;
        // update salesByFranchise
        state.salesByFranchise[id] = state.salesByFranchise[id] || { records: [] };
        if (sale) state.salesByFranchise[id].records = [sale, ...(state.salesByFranchise[id].records || [])];
        // optimistic stock adjustment
        const f = state.byId[id];
        if (f && typeof sale.qty === 'number') f.stock = Math.max(0, (f.stock || 0) - sale.qty);
      })
      .addCase(recordFranchiseSale.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to record sale';
      });
  },
});

export const {
  clearFranchiseError,
  selectFranchise,
  clearSelectedFranchise,
  adjustFranchiseStock,
} = franchiseSlice.actions;

export default franchiseSlice.reducer;
