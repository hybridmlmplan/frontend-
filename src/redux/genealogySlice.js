import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api'; // your axios/fetch wrapper (src/api.js)

// Thunks
export const fetchGenealogy = createAsyncThunk(
  'genealogy/fetch',
  async (userId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/genealogy/${userId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const addMember = createAsyncThunk(
  'genealogy/addMember',
  async ({ sponsorId, placementId, payload }, { rejectWithValue }) => {
    try {
      const res = await api.post('/genealogy', { sponsorId, placementId, ...payload });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const updatePlacement = createAsyncThunk(
  'genealogy/updatePlacement',
  async ({ userId, newPlacementId }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/genealogy/${userId}/placement`, { placementId: newPlacementId });
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchSubtree = createAsyncThunk(
  'genealogy/fetchSubtree',
  async ({ userId, depth = 3 }, { rejectWithValue }) => {
    try {
      const res = await api.get(`/genealogy/${userId}/subtree?depth=${depth}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || err.message);
    }
  }
);

const initialState = {
  tree: null, // full genealogy tree for the current user
  subtrees: {}, // cached subtrees keyed by userId
  loading: false,
  error: null,
  selectedUser: null,
};

const genealogySlice = createSlice({
  name: 'genealogy',
  initialState,
  reducers: {
    resetGenealogy(state) {
      state.tree = null;
      state.subtrees = {};
      state.loading = false;
      state.error = null;
      state.selectedUser = null;
    },
    setSelectedUser(state, action) {
      state.selectedUser = action.payload;
    },
    // optimistic update: insert member into tree locally (used after addMember success or for UI instant feedback)
    insertMemberOptimistic(state, action) {
      const { parentId, member } = action.payload;
      if (!state.tree) return;
      const insert = (node) => {
        if (node.id === parentId) {
          node.children = node.children || [];
          node.children.push(member);
          return true;
        }
        if (!node.children) return false;
        for (let c of node.children) {
          if (insert(c)) return true;
        }
        return false;
      };
      insert(state.tree);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchGenealogy
      .addCase(fetchGenealogy.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGenealogy.fulfilled, (state, action) => {
        state.loading = false;
        state.tree = action.payload;
      })
      .addCase(fetchGenealogy.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load genealogy';
      })

      // addMember
      .addCase(addMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMember.fulfilled, (state, action) => {
        state.loading = false;
        const member = action.payload;
        // server returns created member with parentId
        if (member.parentId && state.tree) {
          const insert = (node) => {
            if (node.id === member.parentId) {
              node.children = node.children || [];
              node.children.push(member);
              return true;
            }
            if (!node.children) return false;
            for (let c of node.children) if (insert(c)) return true;
            return false;
          };
          insert(state.tree);
        }
      })
      .addCase(addMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add member';
      })

      // updatePlacement
      .addCase(updatePlacement.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePlacement.fulfilled, (state, action) => {
        state.loading = false;
        // backend returns updated node or whole tree
        const payload = action.payload;
        if (payload.tree) state.tree = payload.tree;
        if (payload.node) {
          // naive replace
          const replace = (node) => {
            if (node.id === payload.node.id) {
              Object.assign(node, payload.node);
              return true;
            }
            if (!node.children) return false;
            for (let c of node.children) if (replace(c)) return true;
            return false;
          };
          if (state.tree) replace(state.tree);
        }
      })
      .addCase(updatePlacement.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update placement';
      })

      // fetchSubtree
      .addCase(fetchSubtree.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubtree.fulfilled, (state, action) => {
        state.loading = false;
        const { userId, subtree } = action.payload;
        state.subtrees[userId] = subtree;
      })
      .addCase(fetchSubtree.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load subtree';
      });
  },
});

export const { resetGenealogy, setSelectedUser, insertMemberOptimistic } = genealogySlice.actions;
export default genealogySlice.reducer;
