import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

const tokenFromStorage = localStorage.getItem("token");

const initialState = {
  user: null,
  token: tokenFromStorage || null,
  loading: false,
  error: null
};

export const login = createAsyncThunk("auth/login", async ({ emailOrId, password }, thunkAPI) => {
  try {
    const res = await api.post("/auth/login", { identifier: emailOrId, password });
    const data = res.data;
    if (data?.status) {
      localStorage.setItem("token", data?.data?.token);
      return data.data;
    }
    return thunkAPI.rejectWithValue(data.message || "Login failed");
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

export const logout = createAsyncThunk("auth/logout", async () => {
  localStorage.removeItem("token");
  return true;
});

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (s) => { s.loading = true; s.error = null; })
      .addCase(login.fulfilled, (s, a) => { s.loading = false; s.token = a.payload.token; s.user = a.payload.user; })
      .addCase(login.rejected, (s, a) => { s.loading = false; s.error = a.payload; })
      .addCase(logout.fulfilled, (s) => { s.user = null; s.token = null; });
  }
});

export default slice.reducer;
