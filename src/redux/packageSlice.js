import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api";

export const buyPackage = createAsyncThunk("package/buy", async ({ packageCode, epin }, thunkAPI) => {
  try {
    const res = await api.post("/order/create", { packageCode, epin });
    return res.data.data;
  } catch (err) {
    return thunkAPI.rejectWithValue(err.response?.data?.message || err.message);
  }
});

const slice = createSlice({
  name: "package",
  initialState: { buying: false, error: null, lastOrder: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(buyPackage.pending, (s) => { s.buying = true; s.error = null; })
     .addCase(buyPackage.fulfilled, (s, a) => { s.buying = false; s.lastOrder = a.payload; })
     .addCase(buyPackage.rejected, (s, a) => { s.buying = false; s.error = a.payload; });
  }
});

export default slice.reducer;
