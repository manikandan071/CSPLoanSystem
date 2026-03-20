import { sp } from "@pnp/sp";
import {
  setTermMap,
  setTermsOptions,
} from "../../redux/features/LoanDeatilsSlice";

const getTermChildren = async (
  groupId: string,
  setId: string,
  termId: string,
) => {
  return sp.termStore.groups
    .getById(groupId)
    .sets.getById(setId)
    .terms.getById(termId)
    .children();
};

const buildChildTerms = async (
  groupId: string,
  setId: string,
  terms: any[],
): Promise<any[]> => {
  if (!terms?.length) return [];

  const results = await Promise.all(
    terms.map(async (term) => {
      const grandChildren = await getTermChildren(groupId, setId, term.id);
      return {
        termName: term.labels?.[0]?.name || term.name,
        termId: term.id,
        childrens: grandChildren.length
          ? await buildChildTerms(groupId, setId, grandChildren)
          : [],
      };
    }),
  );

  return results;
};

const buildTermHierarchy = async (
  groupId: string,
  setId: string,
  terms: any[],
) => {
  if (!terms?.length) return [];

  const nodes = await Promise.all(
    terms.map(async (term) => {
      const children = await getTermChildren(groupId, setId, term.id);
      return {
        termGroup: term.labels?.[0]?.name || term.name,
        termId: term.id,
        childrens: children.length
          ? await buildChildTerms(groupId, setId, children)
          : [],
      };
    }),
  );

  return nodes;
};

const mapToGroupOptions = (terms: any[]) =>
  terms.map((group) => ({
    label: group.termGroup,
    items: group.childrens.map((child: any) => ({
      label: child.termName,
      value: child.termName,
    })),
  }));

export const getAllCspLoanTerms = async (setDispatch: any) => {
  const fullStructure: Record<
    string,
    { terms: { termGroup: string; childrens: any[] }[] }
  > = {};

  try {
    const groups = await sp.termStore.groups();
    const cspGroup = groups.find((g) => g.name === "CSP Loan Content");
    if (!cspGroup) return null;

    const sets = await sp.termStore.groups.getById(cspGroup.id).sets();

    await Promise.all(
      sets.map(async (set) => {
        const setName = set.localizedNames?.[0]?.name || "Unnamed Set";
        const terms = await sp.termStore.groups
          .getById(cspGroup.id)
          .sets.getById(set.id)
          .terms();

        const structuredTerms = await buildTermHierarchy(
          cspGroup.id,
          set.id,
          terms,
        );
        fullStructure[setName] = { terms: structuredTerms };
      }),
    );
    const flatMap: Record<string, string> = {};

    Object.values(fullStructure).forEach((setData: any) => {
      setData.terms.forEach((group: any) => {
        const flattenTerms = (termArray: any[]) => {
          termArray.forEach((t) => {
            flatMap[t.termName || t.termGroup] = t.id || t.termId || t.termGuid;
            if (t.childrens?.length) flattenTerms(t.childrens);
          });
        };
        flattenTerms(group.childrens || []);
      });
    });
    setDispatch(setTermMap(flatMap));
    //   setTermMap(flatMap);
    console.log("✅ Term map:", flatMap);

    const filteredStructure: any = {};
    Object.keys(fullStructure).forEach((setName) => {
      if (setName === "Document Classification") return;
      const setData = fullStructure[setName];
      const termsWithChildren = setData.terms.filter(
        (term) => term.childrens?.length > 0,
      );
      if (termsWithChildren.length > 0) {
        filteredStructure[setName] = { terms: termsWithChildren };
      }
    });
    setDispatch(
      setTermsOptions({
        AssetManagement: mapToGroupOptions(
          filteredStructure["Asset Management"]?.terms || [],
        ),
        CSP_Legal: mapToGroupOptions(
          filteredStructure["CSP Legal"]?.terms || [],
        ),
        Servicing: mapToGroupOptions(
          filteredStructure["Servicing"]?.terms || [],
        ),
      }),
    );
  } catch (error) {
    console.error("❌ Error fetching CSP Loan Content term store:", error);
  }
};
