/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice } from "@reduxjs/toolkit";

const mainState = {
  loansDetails: [],
  tempSponsorDetails: [],
  sponsorDetails: [],
  termMap: {},
  termsOptions: {},
};

const LoanDeatilsSlice = createSlice({
  name: "LoanDeatilsSlice",
  initialState: mainState,
  reducers: {
    setloansDetails: (state, action) => {
      state.loansDetails = action.payload;
    },
    setTermMap: (state, action) => {
      state.termMap = action.payload;
    },
    setTermsOptions: (state, action) => {
      state.termsOptions = action.payload;
    },
    setTempSponsorDetails: (state, action) => {
      state.tempSponsorDetails = action.payload;
    },
    setSponsorDetails: (state, action) => {
      state.sponsorDetails = action.payload;
    },
  },
});

export const {
  setloansDetails,
  setTermMap,
  setTermsOptions,
  setTempSponsorDetails,
  setSponsorDetails,
} = LoanDeatilsSlice.actions;
export default LoanDeatilsSlice.reducer;
