/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { sp } from "@pnp/sp/presets/all";
import { IUserDetails } from "../../interfaces/common";
import { ILoanTree } from "../../interfaces/loandocument";
import { setloansDetails } from "../../redux/features/LoanDeatilsSlice";
import { formatDate } from "../../utils/CommonUtils";
import { LIBRARIES } from "../../constants/constants";

const SPONSOR_FIELD = "Sponsor";

export const createNewFolder = async (
  folderName: string,
  parentPath: string, // e.g. "3000101/Notable Cases"  ← just the path after "exchange/"
  serverRelativeURL: string,
  sponsorName: string,
): Promise<ILoanTree> => {
  const base = serverRelativeURL.replace(/\/$/, "");

  const serverRelativePath = `${base}/${LIBRARIES.LOAN_INTERNAL_NAME}/${parentPath}/${folderName}`;

  await sp.web.folders.add(serverRelativePath);

  const folderItems = await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.filter(`FileRef eq '${serverRelativePath}' and FSObjType eq 1`)
    .select(
      "Id",
      "FileRef",
      "Title",
      "Created",
      "Modified",
      "Author/Id",
      "Author/Title",
      "Author/EMail",
      "Editor/Id",
      "Editor/Title",
      "Editor/EMail",
    )
    .expand("Author", "Editor")
    .top(1)
    .getAll();

  if (!folderItems || folderItems.length === 0) {
    throw new Error(
      `Folder item not found after creation: ${serverRelativePath}`,
    );
  }

  const item = folderItems[0];

  await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(item.Id)
    .update({
      [SPONSOR_FIELD]: sponsorName,
      Title: folderName,
    });

  const createdBy: IUserDetails = {
    Id: item.Author?.Id,
    Title: item.Author?.Title,
    Email: item.Author?.EMail,
  };

  const modifiedBy: IUserDetails = {
    Id: item.Editor?.Id,
    Title: item.Editor?.Title,
    Email: item.Editor?.EMail,
  };

  return {
    name: folderName,
    Path: serverRelativePath,
    Id: item.Id,
    isFile: false,
    SubFolders: [],
    Sponsor: sponsorName,
    AssetManagement: [],
    Servicing: [],
    Legal: [],
    CreatedBy: createdBy,
    CreatedByTitle: item.Author?.Title ?? "",
    ModifiedBy: modifiedBy,
    Created: formatDate(item.Created) ?? "",
    Modified: formatDate(item.Modified) ?? "",
  };
};

export const insertFolderIntoTree = (
  nodes: ILoanTree[],
  parentPath: string,
  newFolder: ILoanTree,
): ILoanTree[] => {
  return nodes.map((node) => {
    const nodePath = node.Path.replace(/^\//, "");
    const comparePath = parentPath.replace(/^\//, "");
    if (nodePath === comparePath) {
      return {
        ...node,
        SubFolders: [...(node.SubFolders || []), newFolder],
      };
    }

    if (node.SubFolders?.length) {
      return {
        ...node,
        SubFolders: insertFolderIntoTree(
          node.SubFolders,
          parentPath,
          newFolder,
        ),
      };
    }

    return node;
  });
};

export const handleNewFolder = async (
  folderName: string,
  parentPath: string,
  sponsorName: string,
  dispatch: any,
  loansDetails: ILoanTree[],
) => {
  if (!folderName.trim()) return;

  try {
    const webUrl = await sp.web.select("ServerRelativeUrl").get();
    const serverRelativeURL = webUrl.ServerRelativeUrl;

    const newFolderNode = await createNewFolder(
      folderName.trim(),
      parentPath,
      serverRelativeURL,
      sponsorName,
    );

    const base = serverRelativeURL.replace(/\/$/, "");

    const ParentServerRelativePath = `${base}/${LIBRARIES.LOAN_INTERNAL_NAME}/${parentPath}`;

    const updatedTree = insertFolderIntoTree(
      loansDetails,
      ParentServerRelativePath,
      newFolderNode,
    );

    dispatch(setloansDetails(updatedTree));
  } catch (err) {
    console.error("❌ Error creating folder:", err);
  }
};
