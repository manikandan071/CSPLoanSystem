/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { sp } from "@pnp/sp";
import { setSponsorDetails } from "../../redux/features/LoanDeatilsSlice";

export const getSponsorsDetails = async (setDispatch: any) => {
  try {
    const getSponsors = await sp.web.lists
      .getByTitle("Sponsors")
      .items.top(5000)
      .get()
      .then((sponsors) => {
        return sponsors?.map((sponser: any) => {
          return {
            Id: sponser.Id,
            Title: sponser.Title,
            Description: sponser.Description,
          };
        });
      });
    setDispatch(setSponsorDetails(getSponsors));
  } catch (err) {
    console.log("❌ Error fetching sponsors:", err);
  }
};
