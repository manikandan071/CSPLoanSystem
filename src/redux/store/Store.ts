import { configureStore } from "@reduxjs/toolkit";
import LoanDeatilsSlice from "../features/LoanDeatilsSlice";
import CommonSlice from "../features/CommonSlice";

const store = configureStore({
  reducer: {
    LoanDetailsContext: LoanDeatilsSlice,
    CommonDetailsContext: CommonSlice,
  },
});

export { store };
