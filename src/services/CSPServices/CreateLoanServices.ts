/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { sp } from "@pnp/sp/presets/all";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/folders";
import "@pnp/sp/fields";
import { ILoanTree } from "../../interfaces/loandocument";
import { IUserDetails } from "../../interfaces/common";
import { buildLoanFolderStructure, LIBRARIES } from "../../constants/constants";
import { setloansDetails } from "../../redux/features/LoanDeatilsSlice";
import { formatDate } from "../../utils/CommonUtils";

const SPONSOR_FIELD = "Sponsor";

/**
 * Creates a folder in the SharePoint library and sets the Sponsor field.
 * Returns the created/updated folder item with its Id.
 */
async function createFolderWithSponsor(
  folderPath: string,
  sponsorName: string,
  serverRelativeURL: string,
): Promise<{ Id: number; Path: string }> {
  const base = serverRelativeURL.replace(/\/$/, "");
  const serverRelativePath = `${base}/${LIBRARIES.LOAN_INTERNAL_NAME}/${folderPath}`;

  // Split into parent path and folder name
  const lastSlash = folderPath.lastIndexOf("/");
  const isRootLevel = lastSlash === -1;

  if (isRootLevel) {
    // Direct child of library root — original approach works fine
    await sp.web.lists
      .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
      .rootFolder.folders.addUsingPath(folderPath, true);
  } else {
    // Nested folder — navigate to the parent folder first
    const parentFolderPath = folderPath.substring(0, lastSlash);
    const folderName = folderPath.substring(lastSlash + 1);
    const parentServerRelativePath = `${base}/${LIBRARIES.LOAN_INTERNAL_NAME}/${parentFolderPath}`;

    await sp.web
      .getFolderByServerRelativePath(parentServerRelativePath)
      .folders.addUsingPath(folderName, true);
  }

  // Query for the created folder item
  const items = await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.filter(`FileRef eq '${serverRelativePath}' and FSObjType eq 1`)
    .select("Id", "FileRef", "Title", "Created", "Modified")
    .top(1)
    .getAll();

  if (!items || items.length === 0) {
    throw new Error(
      `Folder item not found after creation: ${serverRelativePath}`,
    );
  }

  const folderItem = items[0];

  await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(folderItem.Id)
    .update({
      [SPONSOR_FIELD]: sponsorName,
      Title: folderPath.split("/").pop() ?? folderPath,
    });

  return {
    Id: folderItem.Id as number,
    Path: folderItem.FileRef as string,
  };
}

/**
 * Recursively builds an ILoanTree node for a given folder path.
 */
async function buildTreeNode(
  folderPath: string,
  sponsorName: string,
  allPaths: string[],
  serverRelativeURL: string,
  onFolderCreated?: () => void, // ✅ new param
): Promise<ILoanTree> {
  const { Id, Path } = await createFolderWithSponsor(
    folderPath,
    sponsorName,
    serverRelativeURL,
  );

  onFolderCreated?.(); // ✅ fires immediately after this folder is created

  const directChildren = allPaths.filter((p) => {
    if (p === folderPath) return false;
    if (!p.startsWith(folderPath + "/")) return false;
    const remainder = p.slice(folderPath.length + 1);
    return !remainder.includes("/");
  });

  const subFolders: ILoanTree[] = await Promise.all(
    directChildren.map((childPath) =>
      buildTreeNode(
        childPath,
        sponsorName,
        allPaths,
        serverRelativeURL,
        onFolderCreated, // ✅ pass down recursively
      ),
    ),
  );

  const folderItem = await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(Id)
    .select(
      "Id",
      "Title",
      "FileRef",
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
    .get();

  const createdBy: IUserDetails = {
    Id: folderItem.Author?.Id,
    Title: folderItem.Author?.Title,
    Email: folderItem.Author?.EMail,
  };

  const folderName = folderPath.split("/").pop() ?? folderPath;

  return {
    name: folderName,
    Path,
    Id,
    isFile: false,
    SubFolders: subFolders,
    Sponsor: sponsorName,
    AssetManagement: [],
    Servicing: [],
    Legal: [],
    CreatedBy: createdBy,
    CreatedByTitle: folderItem.Author?.Title ?? "",
    ModifiedBy: createdBy,
    Created: formatDate(folderItem.Created) ?? "",
    Modified: formatDate(folderItem.Modified) ?? "",
  };
}

/**
 * Main service function: creates the full loan folder tree in SharePoint
 * and returns the populated ILoanTree object rooted at loanNumber.
 */
export async function createLoanFolders(
  loanNumber: string,
  sponsorName: string,
  setDispatch: any,
  masterLoanDocuments: ILoanTree[],
  onProgress?: (progress: number) => void, // ✅ new param
): Promise<void> {
  const allPaths = buildLoanFolderStructure(loanNumber);
  const webUrl = await sp.web.select("ServerRelativeUrl").get();
  const serverRelativeURL = webUrl.ServerRelativeUrl;

  const total = allPaths.length;
  let completed = 0;

  // ✅ Progress callback that increments on each folder created
  const handleFolderCreated = () => {
    completed += 1;
    onProgress?.(Math.round((completed / total) * 100));
  };

  const loanTree = await buildTreeNode(
    loanNumber,
    sponsorName,
    allPaths,
    serverRelativeURL,
    handleFolderCreated,
  );

  setDispatch(setloansDetails([loanTree, ...masterLoanDocuments]));
}
