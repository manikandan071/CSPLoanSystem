/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";

const mainState = {
  currentUserDetails: {},
};

const CommonSlice = createSlice({
  name: "CommonSlice",
  initialState: mainState,
  reducers: {
    setCurrentUserDetails: (state, action) => {
      state.currentUserDetails = action.payload;
    },
  },
});

export const { setCurrentUserDetails } = CommonSlice.actions;
export default CommonSlice.reducer;
