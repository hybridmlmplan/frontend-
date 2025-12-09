import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchPairIncome = createAsyncThunk("income/fetchPair", async (_, thunkAPI) => {
  try {
    const res = await api.get("/income/pair");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

const slice = createSlice({
  name: "income",
  initialState: { pair: [], level: [], royalty: [], fund: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchPairIncome.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchPairIncome.fulfilled, (s, a) => { s.loading = false; s.pair = a.payload; })
     .addCase(fetchPairIncome.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default slice.reducer;
