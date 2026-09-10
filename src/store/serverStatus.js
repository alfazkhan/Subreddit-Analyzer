import { createSlice } from "@reduxjs/toolkit";

const initialServerStatusState = {
  serverStatus: "checking",
  latestSummary: {},
  changeSinceLastLoad:{}
};

const serverStatusSlice = createSlice({
  name: "serverStatus",
  initialState: initialServerStatusState,
  reducers: {
    serverStatusChange(state, action) {
      state.serverStatus = action.payload;
    },
    updateCacheSummary(state, action) {
      const currentSummary = JSON.parse(localStorage.getItem("cacheSummary"));
      const changeSinceLastLoad = {};
      if (!currentSummary) {
        localStorage.setItem("cacheSummary", JSON.stringify(action.payload));
      } else {
        Object.keys(currentSummary).forEach((sub) => {
          changeSinceLastLoad[sub] =
            action.payload[sub].count - currentSummary[sub].count;
        });
        localStorage.setItem("cacheSummary", JSON.stringify(action.payload));
      }
      state.latestSummary =  action.payload
      state.changeSinceLastLoad = changeSinceLastLoad
    },
  },
});

export const serverStatusActions = serverStatusSlice.actions;

export default serverStatusSlice.reducer;
