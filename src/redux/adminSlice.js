import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchUsers = createAsyncThunk("admin/fetchUsers", async (_, thunkAPI) => {
  try {
    const res = await api.get("/admin/users");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const fetchAllIncomes = createAsyncThunk("admin/fetchIncomes", async (_, thunkAPI) => {
  try {
    const res = await api.get("/admin/ledgers/bv");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

const slice = createSlice({
  name: "admin",
  initialState: { users: [], incomes: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchUsers.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchUsers.fulfilled, (s, a) => { s.loading = false; s.users = a.payload; })
     .addCase(fetchUsers.rejected, (s, a) => { s.loading = false; s.error = a.payload; });

    b.addCase(fetchAllIncomes.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchAllIncomes.fulfilled, (s, a) => { s.loading = false; s.incomes = a.payload; })
     .addCase(fetchAllIncomes.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default slice.reducer;
