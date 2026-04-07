/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TopNav from "./TopNav/TopNav";
import LoanDashboard from "./LoanDashboard/LoanDashboard";
import SponsorDashboard from "./SponsorDashboard/SponsorDashboard";
import Loader from "./Loader/Loader";

import {
  getAllLibraryItems,
  getCurrentUserDetails,
} from "../../../services/CSPServices/CSPServices";
import { getSponsorsDetails } from "../../../services/CSPServices/SponsorServices";
import { getAllCspLoanTerms } from "../../../services/CSPServices/TermsetServices";
import BulkUpload from "./BulkUpload/BulkUpload";
import { RootState } from "../../../interfaces/common";
import { ILoanTree } from "../../../interfaces/loandocument";

interface MainComponentProps {}

const MainComponent: React.FC<MainComponentProps> = () => {
  const dispatch = useDispatch();
  const termMap: any = useSelector(
    (state: RootState) => state.LoanDetailsContext.termMap,
  );
  const termsOptions: any = useSelector(
    (state: RootState) => state.LoanDetailsContext.termsOptions,
  );
  const loansDetails: ILoanTree[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.loansDetails,
  );
  const currentUserDetails: any = useSelector(
    (state: RootState) => state.CommonDetailsContext.currentUserDetails,
  );
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<string>("loan");

  useEffect(() => {
    setLoading(true);
    getCurrentUserDetails(dispatch);
    getAllCspLoanTerms(dispatch);
    getAllLibraryItems("CSP Loan Files", dispatch, setLoading);
    getSponsorsDetails(dispatch);
    setActiveNav("loan");
  }, []);

  useEffect(() => {
    console.log("termMap", termMap);
    console.log("termsOptions", termsOptions);
    console.log("loansDetails", loansDetails);
    console.log("currentUserDetails", currentUserDetails);
  }, [loansDetails]);

  return (
    <div style={{ background: "#f4efef" }}>
      <TopNav activeNav={activeNav} setActiveNav={setActiveNav} />
      {loading ? (
        <Loader />
      ) : (
        <div>
          {activeNav === "loan" && <LoanDashboard />}
          {activeNav === "bulkupload" && <BulkUpload />}
          {activeNav === "sponsor" && <SponsorDashboard />}
          {activeNav === "analysis" && <div>Analysis</div>}
        </div>
      )}
    </div>
  );
};

export default MainComponent;
