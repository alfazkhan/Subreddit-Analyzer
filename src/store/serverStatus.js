import { createSlice } from "@reduxjs/toolkit";

const initialServerStatusState = {
  serverStatus: "checking",
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState: initialServerStatusState,
  reducers: {
    serverStatusChange(state, action) {
      state.serverStatus = action.payload;
    },
  },
});

export const serverStatusActions = serverStatusSlice.actions;

export default serverStatusSlice.reducer;
