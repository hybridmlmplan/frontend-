import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchMe = createAsyncThunk("user/fetchMe", async (_, thunkAPI) => {
  try {
    const res = await api.get("/auth/me");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

const slice = createSlice({
  name: "user",
  initialState: { profile: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchMe.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchMe.fulfilled, (s, a) => { s.loading = false; s.profile = a.payload; })
     .addCase(fetchMe.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default slice.reducer;
