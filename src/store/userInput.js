import { createSlice } from "@reduxjs/toolkit";

const initialUserInputState = {
  subredditID: null,
  subredditName: "Nothing to Select...",
  targetPostCount: 100,
  useOnlyCache: true,
};

const userInputSlice = createSlice({
  name: "userInput",
  initialState: initialUserInputState,
  reducers: {
    handleIDChange(state, action) {
      state.subredditID = action.payload;
    },
    handleNameChange(state, action) {
      state.subredditName = action.payload;
    },
    handleCountChange(state, action) {
      state.targetPostCount = action.payload;
    },
    toggleCachingChange(state, action) {
      console.log("Caching method changed", action);
      state.useOnlyCache = action.payload;
    },
  },
});

export const userInputAction = userInputSlice.actions;

export default userInputSlice.reducer;
