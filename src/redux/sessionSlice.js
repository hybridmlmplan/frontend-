// src/redux/sessionSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import sessionApi from "../api/sessionApi";

export const fetchCurrentSession = createAsyncThunk("session/fetchCurrent", async (_, thunkAPI) => {
  const res = await sessionApi.getCurrentSession();
  return res.data ?? res;
});

export const fetchSessionStatus = createAsyncThunk("session/fetchStatus", async (_, thunkAPI) => {
  const res = await sessionApi.getSessionStatus();
  return res.data ?? res;
});

const slice = createSlice({
  name: "session",
  initialState: { current: null, status: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchCurrentSession.pending, (s) => { s.loading = true; })
     .addCase(fetchCurrentSession.fulfilled, (s, a) => { s.loading = false; s.current = a.payload; })
     .addCase(fetchCurrentSession.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });

    b.addCase(fetchSessionStatus.pending, (s) => { s.loading = true; })
     .addCase(fetchSessionStatus.fulfilled, (s, a) => { s.loading = false; s.status = a.payload; })
     .addCase(fetchSessionStatus.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });
  }
});

export default slice.reducer;
