import { sp } from "@pnp/sp";
import {
  setloansDetails,
  setTempSponsorDetails,
} from "../../redux/features/LoanDeatilsSlice";
import * as dayjs from "dayjs";
import { ILoanSPitem, ILoanTree } from "../../interfaces/loandocument";

const formatDate = (dateString: string) => {
  if (dayjs(dateString).isValid() === false) {
    console.log("dateString", dateString);
  }
  return dayjs(dateString).isValid()
    ? dayjs(dateString).format("DD/MM/YYYY")
    : "-";
};

const labelRename = (data: any[]) => {
  const updated = data.map((item) => ({
    ...item,
    Label: item.Label.replace(/#/g, ""),
  }));
  return updated;
};

const buildFullFolderTree = (
  items: ILoanSPitem[],
  usersMap: Record<number, any>,
): ILoanTree[] => {
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
          SubFolders: {},
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
      currentLevel = currentLevel[part].SubFolders;
    }

    if (item.FSObjType === 1) {
      if (item.FileLeafRef === "3000101") {
        console.log(item.Created, item.Modified);
      }
      if (!currentLevel[item.FileLeafRef]) {
        currentLevel[item.FileLeafRef] = {
          name: item.FileLeafRef,
          Path: item.FileDirRef + "/" + item.FileLeafRef,
          Id: item.Id,
          SubFolders: {},
          Sponsor: item.Sponsor,
          AssetManagement: labelRename(item.AssetManagement),
          Servicing: labelRename(item.Servicing),
          Legal: labelRename(item.Legal),
          CreatedBy: usersMap[item.AuthorId] || null,
          CreatedByTitle: usersMap[item.AuthorId]
            ? usersMap[item.AuthorId].Title
            : "",
          ModifiedBy: usersMap[item.EditorId] || null,
          Created: formatDate(item.Created),
          Modified: formatDate(item.Modified),
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
        currentLevel[item.FileLeafRef].Servicing = labelRename(item.Servicing);
        currentLevel[item.FileLeafRef].Legal = labelRename(item.Legal);
        currentLevel[item.FileLeafRef].CreatedBy =
          usersMap[item.AuthorId] || null;
        currentLevel[item.FileLeafRef].CreatedByTitle = usersMap[item.AuthorId]
          ? usersMap[item.AuthorId].Title
          : "";
        currentLevel[item.FileLeafRef].ModifiedBy =
          usersMap[item.EditorId] || null;
        currentLevel[item.FileLeafRef].Created = formatDate(item.Created);
        currentLevel[item.FileLeafRef].Modified = formatDate(item.Modified);
      }
    } else if (item.FSObjType === 0) {
      currentLevel[item.FileLeafRef] = {
        name: item.FileLeafRef,
        Path: item.FileDirRef + "/" + item.FileLeafRef,
        isFile: true,
        Id: item.Id,
        SubFolders: {},
        Sponsor: item.Sponsor,
        AssetManagement: labelRename(item.AssetManagement),
        Servicing: labelRename(item.Servicing),
        Legal: labelRename(item.Legal),
        CreatedBy: usersMap[item.AuthorId] || null,
        CreatedByTitle: usersMap[item.AuthorId]
          ? usersMap[item.AuthorId].Title
          : "",
        ModifiedBy: usersMap[item.EditorId] || null,
        Created: formatDate(item.Created),
        Modified: formatDate(item.Modified),
      };
    }
  }

  const convertToArray = (obj: Record<string, any>): ILoanTree[] =>
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
      CreatedByTitle: node.CreatedByTitle,
      ModifiedBy: node.ModifiedBy,
      Created: node.Created,
      Modified: node.Modified,
      SubFolders: convertToArray(node.SubFolders || {}),
    }));

  return convertToArray(treeMap);
};

export const getUniqueSponsorsFromTree = (tree: ILoanTree[]) => {
  const sponsorSet = new Set<string>();

  const traverse = (nodes: ILoanTree[]) => {
    for (const node of nodes) {
      if (node.Sponsor && node.Sponsor.trim()) {
        sponsorSet.add(node.Sponsor.trim());
      }

      if (node.SubFolders?.length) {
        traverse(node.SubFolders);
      }
    }
  };

  traverse(tree);

  return Array.from(sponsorSet)
    .map((sponsor) => ({
      name: sponsor,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
};

export const getAllLibraryItems = async (
  libraryName: string,
  setDispatch: any,
  setLoading: any,
) => {
  try {
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
    const treeLoanDocuments = buildFullFolderTree(allItems, usersMap);
    const uniqueSponsors = getUniqueSponsorsFromTree(treeLoanDocuments);
    console.log(uniqueSponsors);
    setDispatch(setTempSponsorDetails(uniqueSponsors));
    setDispatch(setloansDetails(treeLoanDocuments));
    setLoading(false);
    //   return allItems;
  } catch (err) {
    console.error("❌ Error fetching items:", err);
    return [];
  }
};
