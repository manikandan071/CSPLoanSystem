/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import TopNav from "./TopNav/TopNav";
import LoanDashboard from "./LoanDashboard/LoanDashboard";
import SponsorDashboard from "./SponsorDashboard/SponsorDashboard";
import Loader from "./Loader/Loader";
import "../assets/css/common.css";

import { getAllLibraryItems } from "../../../services/CSPServices/CSPServices";
import { getSponsorsDetails } from "../../../services/CSPServices/SponsorServices";
import { getAllCspLoanTerms } from "../../../services/CSPServices/termsetservices";

interface MainComponentProps {}

const MainComponent: React.FC<MainComponentProps> = () => {
  const dispatch = useDispatch();
  const termMap: any = useSelector(
    (state: any) => state.LoanDetailsContext.termMap,
  );
  const termsOptions: any = useSelector(
    (state: any) => state.LoanDetailsContext.termsOptions,
  );
  const loansDetails: any = useSelector(
    (state: any) => state.LoanDetailsContext.loansDetails,
  );
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<string>("loan");

  console.log("loading", loading);

  useEffect(() => {
    setLoading(true);
    getAllCspLoanTerms(dispatch);
    getAllLibraryItems("CSP Loan Files", dispatch, setLoading);
    getSponsorsDetails(dispatch);
    setActiveNav("loan");
    // setLoading(false);
  }, []);

  useEffect(() => {
    console.log("termMap", termMap);
    console.log("termsOptions", termsOptions);
    console.log("loansDetails", loansDetails);
  }, [loansDetails]);

  return (
    <div style={{ background: "#f4efef" }}>
      <TopNav activeNav={activeNav} setActiveNav={setActiveNav} />
      {loading ? (
        <Loader />
      ) : (
        <div>
          {activeNav === "loan" && <LoanDashboard />}
          {activeNav === "bulkupload" && <div>Bulk Upload</div>}
          {activeNav === "sponsor" && <SponsorDashboard />}
          {activeNav === "analysis" && <div>Analysis</div>}
        </div>
      )}
    </div>
  );
};

export default MainComponent;
