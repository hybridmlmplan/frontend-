// src/redux/incomeSlice.js
// Redux Toolkit slice for handling all income-related state (binary, royalty, rank, fund, pair incomes)
// Designed for the Hybrid MLM plan described in the master requirement document.
// - Uses axios for API calls (async thunks)
// - Keeps a normalized list of incomes with basic CRUD operations
// - Includes selectors and useful helper actions

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

// Thunks
// Fetch all incomes for a user (server expected to return an array)
export const fetchIncomes = createAsyncThunk(
  'income/fetchIncomes',
  async ({ userId }, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE}/incomes?userId=${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Create a new income record
export const createIncome = createAsyncThunk(
  'income/createIncome',
  async ({ payload }, { rejectWithValue }) => {
    try {
      const res = await axios.post(`${API_BASE}/incomes`, payload);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Update an income (mark paid, release pending, etc.)
export const updateIncome = createAsyncThunk(
  'income/updateIncome',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const res = await axios.put(`${API_BASE}/incomes/${id}`, updates);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

// Delete an income (rare operation, admin or cleanup)
export const deleteIncome = createAsyncThunk(
  'income/deleteIncome',
  async ({ id }, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE}/incomes/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  incomes: [], // array of income objects { id, userId, type, amount, pv, bv, session, packageType, leftUser, rightUser, status, createdAt, meta }
  loading: false,
  error: null,
};

const incomeSlice = createSlice({
  name: 'income',
  initialState,
  reducers: {
    // Local optimistic updates
    addIncomeLocal(state, action) {
      state.incomes.unshift(action.payload);
    },
    updateIncomeLocal(state, action) {
      const idx = state.incomes.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) state.incomes[idx] = { ...state.incomes[idx], ...action.payload.updates };
    },
    removeIncomeLocal(state, action) {
      state.incomes = state.incomes.filter(i => i.id !== action.payload);
    },
    clearIncomeError(state) {
      state.error = null;
    }
  },
  extraReducers: builder => {
    // fetchIncomes
    builder.addCase(fetchIncomes.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchIncomes.fulfilled, (state, action) => {
      state.loading = false;
      // Expect server to return incomes ordered by most recent first; if not, the UI can sort
      state.incomes = action.payload || [];
    });
    builder.addCase(fetchIncomes.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to fetch incomes';
    });

    // createIncome
    builder.addCase(createIncome.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createIncome.fulfilled, (state, action) => {
      state.loading = false;
      // New income pushed to the top
      state.incomes.unshift(action.payload);
    });
    builder.addCase(createIncome.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to create income';
    });

    // updateIncome
    builder.addCase(updateIncome.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateIncome.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload;
      const idx = state.incomes.findIndex(i => i.id === updated.id);
      if (idx !== -1) state.incomes[idx] = { ...state.incomes[idx], ...updated };
    });
    builder.addCase(updateIncome.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to update income';
    });

    // deleteIncome
    builder.addCase(deleteIncome.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteIncome.fulfilled, (state, action) => {
      state.loading = false;
      state.incomes = state.incomes.filter(i => i.id !== action.payload);
    });
    builder.addCase(deleteIncome.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload || 'Failed to delete income';
    });
  }
});

export const { addIncomeLocal, updateIncomeLocal, removeIncomeLocal, clearIncomeError } = incomeSlice.actions;

// Selectors
export const selectAllIncomes = state => state.income.incomes;
export const selectIncomeById = (state, id) => state.income.incomes.find(i => i.id === id);
export const selectIncomeByType = (state, type) => state.income.incomes.filter(i => i.type === type);
export const selectIncomeLoading = state => state.income.loading;
export const selectIncomeError = state => state.income.error;

export default incomeSlice.reducer;

/*
Notes / how to use (implementation guidance):
- server endpoints assumed:
  GET  /api/incomes?userId=...      => list incomes
  POST /api/incomes                => create new income (body = income data)
  PUT  /api/incomes/:id            => update income
  DELETE /api/incomes/:id          => delete income

- Income object shape (suggested):
  {
    id: string | number,
    userId: string | number,
    type: 'binary' | 'royalty' | 'rank' | 'fund' | 'pair' | 'pending' | 'other',
    packageType: 'silver' | 'gold' | 'ruby' | null,
    amount: number,
    pv: number,          // PV used for binary matching
    bv: number,          // BV used for royalty/fund/level
    session: number | string, // session index or identifier
    leftUser: id | null,
    rightUser: id | null,
    status: 'pending' | 'released' | 'paid' | 'cancelled',
    createdAt: ISOString,
    meta: { any additional info }
  }

- In the UI, you can use fetchIncomes({ userId }) on component mount and then display incomes grouped by type.
- Use updateIncome to change status from 'pending' to 'released' when Red->Green cycles happen or when admin releases pending incomes.
- For optimistic UI, call addIncomeLocal/updateIncomeLocal before dispatching createIncome/updateIncome and rollback on error.
*/
