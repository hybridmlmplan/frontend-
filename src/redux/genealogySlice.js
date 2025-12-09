import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const fetchGenealogy = createAsyncThunk("genealogy/fetch", async (_, thunkAPI) => {
  try {
    const res = await api.get("/user/genealogy");
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

const slice = createSlice({
  name: "genealogy",
  initialState: { tree: null, directs: [], levelView: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchGenealogy.pending, (s) => { s.loading = true; s.error = null; })
     .addCase(fetchGenealogy.fulfilled, (s, a) => { s.loading = false; s.tree = a.payload; })
     .addCase(fetchGenealogy.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
  }
});

export default slice.reducer;
