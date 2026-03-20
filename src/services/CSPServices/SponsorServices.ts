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
    console.log("All Sponsors:", getSponsors);
    setDispatch(setSponsorDetails(getSponsors));
  } catch (err) {
    console.error("❌ Error fetching sponsors:", err);
    return [];
  }
};
