/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { useEffect, useState } from "react";
import { WebPartContext } from "@microsoft/sp-webpart-base";
import { sp } from "@pnp/sp";
import { Paginator } from "primereact/paginator";
import FolderTree from "./FolderTreeView";
import Loader from "../Loader/Loader";

interface ExchangeDashboardFastProps {
  context: WebPartContext;
  libraryName: string;
}

const ExchangeDashboardFast: React.FC<ExchangeDashboardFastProps> = ({
  context,
  libraryName,
}) => {
  const [loading, setLoading] = useState(true);
  const [loanData, setLoanData] = useState<any[]>([]);
  const [options, setOptions] = useState<any>({
    AssetManagement: [],
    CSP_Legal: [],
    Servicing: [],
  });
  const [termMap, setTermMap] = useState<Record<string, string>>({});

  console.log("loading", loading);
  console.log("termMap", termMap);
  console.log("loanData", loanData);

  // Pagination states
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(20);

  const getAllLibraryItems = async (libraryName: string) => {
    try {
      const list = sp.web.lists.getByTitle(libraryName);
      const pageSize = 5000;
      let allItems: any[] = [];
      let batchCount = 0;
      console.log(batchCount);

      let paged = await list.items
        .select(
          "Id",
          "FileLeafRef",
          "FileDirRef",
          "FSObjType",
          "Created",
          "Modified",
          "Sponsor",
          "AssetManagement",
          "Servicing",
          "Legal",
          "AuthorId",
          "EditorId",
        )
        .top(pageSize)
        .getPaged();

      allItems.push(...paged.results);
      batchCount++;

      while (paged.hasNext) {
        paged = await paged.getNext();
        allItems.push(...paged.results);
        batchCount++;
      }
      console.log("allItems", allItems);

      return allItems;
    } catch (err) {
      console.error("❌ Error fetching items:", err);
      return [];
    }
  };

  interface SharePointItem {
    FileDirRef: string;
    FileLeafRef: string;
    FSObjType: number;
    Id: number;
    Sponsor: string;
    AssetManagement: any[];
    Servicing: any[];
    Legal: any[];
    AuthorId: number;
    EditorId: number;
    Created: string;
    Modified: string;
  }

  interface TreeNode {
    name: string;
    Id?: number;
    isFile?: boolean;
    children?: TreeNode[];
    Sponsor?: string;
    AssetManagement?: any[];
    Servicing?: any[];
    Legal?: any[];
    CreatedBy?: any;
    ModifiedBy?: any;
    Created?: string;
    Modified?: string;
  }

  const labelRename = (data: any[]) => {
    const updated = data.map((item) => ({
      ...item,
      Label: item.Label.replace(/#/g, ""),
    }));
    return updated;
  };

  const buildFullFolderTree = (
    items: SharePointItem[],
    usersMap: Record<number, any>,
  ): TreeNode[] => {
    const treeMap: Record<string, any> = {};

    for (const item of items) {
      const parts = item.FileDirRef.split("/").filter(Boolean);
      const exchangeIndex = parts.indexOf("exchange");
      if (exchangeIndex === -1) continue;

      const pathParts = parts.slice(exchangeIndex + 1);
      let currentLevel = treeMap;

      for (const part of pathParts) {
        if (!currentLevel[part]) {
          currentLevel[part] = {
            name: part,
            Path: "",
            children: {},
            Sponsor: "",
            AssetManagement: [],
            Servicing: [],
            Legal: [],
            CreatedBy: null,
            ModifiedBy: null,
            Id: undefined,
            Created: "",
            Modified: "",
          };
        }
        if (item.FileLeafRef === part && item.FSObjType === 1) {
          currentLevel[part].Id = item.Id;
        }
        currentLevel = currentLevel[part].children;
      }

      if (item.FSObjType === 1) {
        if (!currentLevel[item.FileLeafRef]) {
          currentLevel[item.FileLeafRef] = {
            name: item.FileLeafRef,
            Path: item.FileDirRef + "/" + item.FileLeafRef,
            Id: item.Id,
            children: {},
            Sponsor: item.Sponsor,
            AssetManagement: labelRename(item.AssetManagement),
            Servicing: labelRename(item.Servicing),
            Legal: labelRename(item.Legal),
            CreatedBy: usersMap[item.AuthorId] || null,
            ModifiedBy: usersMap[item.EditorId] || null,
            Created: item.Created,
            Modified: item.Modified,
          };
        } else {
          currentLevel[item.FileLeafRef].Id = item.Id;
          currentLevel[item.FileLeafRef].name = item.FileLeafRef;
          currentLevel[item.FileLeafRef].Path =
            item.FileDirRef + "/" + item.FileLeafRef;
          currentLevel[item.FileLeafRef].Sponsor = item.Sponsor;
          currentLevel[item.FileLeafRef].AssetManagement = labelRename(
            item.AssetManagement,
          );
          currentLevel[item.FileLeafRef].Servicing = labelRename(
            item.Servicing,
          );
          currentLevel[item.FileLeafRef].Legal = labelRename(item.Legal);
          currentLevel[item.FileLeafRef].CreatedBy =
            usersMap[item.AuthorId] || null;
          currentLevel[item.FileLeafRef].ModifiedBy =
            usersMap[item.EditorId] || null;
          currentLevel[item.FileLeafRef].Created = item.Created;
          currentLevel[item.FileLeafRef].Modified = item.Modified;
        }
      } else if (item.FSObjType === 0) {
        currentLevel[item.FileLeafRef] = {
          name: item.FileLeafRef,
          Path: item.FileDirRef + "/" + item.FileLeafRef,
          isFile: true,
          Id: item.Id,
          children: {},
          Sponsor: item.Sponsor,
          AssetManagement: labelRename(item.AssetManagement),
          Servicing: labelRename(item.Servicing),
          Legal: labelRename(item.Legal),
          CreatedBy: usersMap[item.AuthorId] || null,
          ModifiedBy: usersMap[item.EditorId] || null,
          Created: item.Created,
          Modified: item.Modified,
        };
      }
    }

    const convertToArray = (obj: Record<string, any>): TreeNode[] =>
      Object.values(obj).map((node: any) => ({
        name: node.name,
        Path: node.Path,
        Id: node.Id,
        isFile: node.isFile,
        Sponsor: node.Sponsor,
        AssetManagement: labelRename(node.AssetManagement),
        Servicing: labelRename(node.Servicing),
        Legal: labelRename(node.Legal),
        CreatedBy: node.CreatedBy,
        ModifiedBy: node.ModifiedBy,
        Created: node.Created,
        Modified: node.Modified,
        children: convertToArray(node.children || {}),
      }));

    return convertToArray(treeMap);
  };

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

  const getAllCspLoanTerms = async () => {
    const fullStructure: Record<
      string,
      { terms: { termGroup: string; childrens: any[] }[] }
    > = {};

    try {
      const groups = await sp.termStore.groups();
      const cspGroup = groups.find((g) => g.name === "CSP Loan Content");
      if (!cspGroup) return;

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
              flatMap[t.termName || t.termGroup] =
                t.id || t.termId || t.termGuid;
              if (t.childrens?.length) flattenTerms(t.childrens);
            });
          };
          flattenTerms(group.childrens || []);
        });
      });

      setTermMap(flatMap);
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

      setOptions({
        AssetManagement: mapToGroupOptions(
          filteredStructure["Asset Management"]?.terms || [],
        ),
        CSP_Legal: mapToGroupOptions(
          filteredStructure["CSP Legal"]?.terms || [],
        ),
        Servicing: mapToGroupOptions(
          filteredStructure["Servicing"]?.terms || [],
        ),
      });
    } catch (error) {
      console.error("❌ Error fetching CSP Loan Content term store:", error);
    }
  };

  const updateLoanData = (Id: number, value: any) => {
    setLoading(true);
    console.log("Updating Id:", Id, "with value:", value);
    const updateData = (nodes: any[]): any[] => {
      return nodes.map((node) => {
        if (node.Id === Id) {
          return {
            ...node,
            AssetManagement: value?.AssetManagement,
            Servicing: value?.Servicing,
            Legal: value?.Legal,
          };
        } else if (node.children && node.children.length > 0) {
          return { ...node, children: updateData(node.children) };
        } else {
          return node;
        }
      });
    };
    setLoanData((prevData) => updateData(prevData));
    setLoading(false);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        getAllCspLoanTerms();
        const getAllUsers = await sp.web.siteUsers().then((users) => {
          const userslist = users.map((user) => {
            return { Title: user.Title, Email: user.Email, Id: user.Id };
          });
          return userslist;
        });
        console.log("All Users:", getAllUsers);

        const usersMap = getAllUsers.reduce((map: any, user: any) => {
          map[user.Id] = {
            Id: user.Id,
            Title: user.Title,
            Email: user.Email,
          };
          return map;
        }, {});

        const items = await getAllLibraryItems("CSP Loan Files");
        debugger;
        const tree = buildFullFolderTree(items, usersMap);
        setLoanData(tree);
      } catch (err) {
        console.error("Error loading folders", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [libraryName]);

  const onPageChange = (e: any) => {
    setFirst(e.first);
    setRows(e.rows);
  };

  const pagedData = loanData.slice(first, first + rows);

  return (
    <div className="custom-data-table">
      <span
        style={{
          fontSize: "16px",
          marginBottom: "15px",
          display: "flex",
          color: "#0a2e5c",
          fontWeight: "600",
        }}
      >
        CSP Loan Files : {loanData.length}
      </span>
      <div
        style={{
          width: "100%",
          color: "#606066",
          fontSize: "16px",
          padding: "5px 0px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "100%",
            backgroundColor: "#0A2E5C",
            color: "#FFFFFF",
            padding: "8px 0",
          }}
        >
          <div
            style={{
              width: "30%",
              padding: "5px 0px 5px 20px",
              fontWeight: "500",
              fontSize: "15px",
            }}
          >
            Name
          </div>
          <div style={{ width: "10%", padding: "5px" }}>Sponsor</div>
          <div style={{ width: "20%", padding: "5px" }}>Asset Management</div>
          <div style={{ width: "20%", padding: "5px" }}>Servicing</div>
          <div style={{ width: "15%", padding: "5px" }}>Legal</div>
          {/* <div style={{ width: "5%", padding: "5px" }}>Action</div> */}
        </div>
      </div>
      {loading ? (
        <Loader />
      ) : (
        <div style={{ minHeight: "50vh", maxHeight: "69vh", overflow: "auto" }}>
          {pagedData.map((structure, index) => (
            <div key={index}>
              <FolderTree
                node={structure}
                options={options}
                termsDeatils={termMap}
                updateLoanData={updateLoanData}
              />
            </div>
          ))}
        </div>
      )}
      {!loading && (
        <Paginator
          first={first}
          rows={rows}
          totalRecords={loanData.length}
          rowsPerPageOptions={[10, 20, 50]}
          onPageChange={onPageChange}
          style={{ marginTop: "15px" }}
        />
      )}
    </div>
  );
};

export default ExchangeDashboardFast;
