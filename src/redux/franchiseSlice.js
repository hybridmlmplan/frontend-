import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchFranchiseOrders = createAsyncThunk("franchise/orders", async (_, thunkAPI) => {
  try {
    const res = await api.get("/franchise/orders");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const purchaseFranchise = createAsyncThunk("franchise/purchase", async (payload, thunkAPI) => {
  try {
    const res = await api.post("/franchise/purchase", payload);
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

const slice = createSlice({
  name: "franchise",
  initialState: { orders: [], buying: false, lastOrder: null, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchFranchiseOrders.pending, (s) => { s.error = null; })
     .addCase(fetchFranchiseOrders.fulfilled, (s, a) => { s.orders = a.payload; })
     .addCase(fetchFranchiseOrders.rejected, (s, a) => { s.error = a.payload; });

    b.addCase(purchaseFranchise.pending, (s) => { s.buying = true; s.error = null; })
     .addCase(purchaseFranchise.fulfilled, (s, a) => { s.buying = false; s.lastOrder = a.payload; })
     .addCase(purchaseFranchise.rejected, (s, a) => { s.buying = false; s.error = a.payload; });
  }
});

export default slice.reducer;
