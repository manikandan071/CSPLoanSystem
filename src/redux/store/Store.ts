import { configureStore } from "@reduxjs/toolkit";
import LoanDeatilsSlice from "../features/LoanDeatilsSlice";

const store = configureStore({
  reducer: {
    LoanDetailsContext: LoanDeatilsSlice,
  },
});

export { store };
