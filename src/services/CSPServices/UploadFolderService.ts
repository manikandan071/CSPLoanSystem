import { sp } from "@pnp/sp/presets/all";
import {
  FolderNode,
  ILoanTree,
  UploadedFileEntry,
} from "../../interfaces/loandocument";
import {
  buildFileNode,
  insertFilesIntoTree,
} from "../../utils/UploadFilesutils";
import { insertFolderNodeIntoTree } from "../../utils/UploadFoldersUtils";
import { LIBRARIES } from "../../constants/constants";

const SPONSOR_FIELD = "Sponsor";

export const ensureFolder = async (
  serverRelativeFolderPath: string,
  sponsorName: string,
): Promise<void> => {
  try {
    await sp.web.folders.add(serverRelativeFolderPath);

    const folderItems = await sp.web.lists
      .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
      .items.filter(
        `FileRef eq '${serverRelativeFolderPath}' and FSObjType eq 1`,
      )
      .select("Id")
      .top(1)
      .getAll();

    if (folderItems.length > 0) {
      await sp.web.lists
        .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
        .items.getById(folderItems[0].Id)
        .update({ [SPONSOR_FIELD]: sponsorName });
    }
  } catch {
    // folder may already exist — ignore
  }
};

export const uploadSingleFile = async (
  file: File,
  serverRelativeTargetFolder: string,
  sponsorName: string,
): Promise<{ Id: number; Path: string }> => {
  await ensureFolder(serverRelativeTargetFolder, sponsorName);

  const uploaded = await sp.web
    .getFolderByServerRelativeUrl(serverRelativeTargetFolder)
    .files.add(file.name, file, true);

  const item = await uploaded.file.getItem<{ Id: number; FileRef: string }>(
    "Id",
    "FileRef",
  );

  await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(item.Id)
    .update({ [SPONSOR_FIELD]: sponsorName, Title: file.name });

  return { Id: item.Id, Path: item.FileRef };
};

export const createShortcutFile = async (
  sourceAbsoluteUrl: string,
  fileName: string,
  serverRelativeTargetFolder: string,
  sponsorName: string,
): Promise<{ Id: number; Path: string }> => {
  console.log("sourceAbsoluteUrl", sourceAbsoluteUrl);

  await ensureFolder(serverRelativeTargetFolder, sponsorName);

  const baseName = fileName.replace(/\./g, "-");
  const shortcutFileName = `${baseName}.url`;
  const shortcutContent = [
    "[InternetShortcut]",
    `URL=${sourceAbsoluteUrl}`,
    "IDList=",
    "HotKey=0",
    "InternalName=",
    "IconIndex=1",
    "IconFile=",
  ].join("\r\n");

  const shortcutBlob = new Blob([shortcutContent], { type: "text/plain" });

  const folder = sp.web.getFolderByServerRelativeUrl(
    serverRelativeTargetFolder,
  );
  const uploaded = await folder.files.add(shortcutFileName, shortcutBlob, true);

  const item = await uploaded.file.getItem<{ Id: number; FileRef: string }>(
    "Id",
    "FileRef",
  );

  await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(item.Id)
    .update({ [SPONSOR_FIELD]: sponsorName, Title: fileName });

  return { Id: item.Id, Path: sourceAbsoluteUrl };
};

/* eslint-disable @typescript-eslint/no-explicit-any */

interface UploadFolderNodeParams {
  node: FolderNode;
  loanNumber: string;
  parentServerRelativePath: string;
  siteUrl: string;
  isPrimaryLoan: boolean;
  primaryLoanServerPath: string;
  sponsorName: string;
  parentTreePath: string;
  uploadedEntries: Record<string, UploadedFileEntry[]>;
  currentUserDetails: any;
  updateFileStatus: (fileId: string, update: any) => void;
  updateFolderStatus: (folderId: string, update: any) => void;
}

/** Recursively upload a FolderNode and all its children to one loan */
export const uploadFolderNodeToLoan = async ({
  node,
  loanNumber,
  parentServerRelativePath,
  siteUrl,
  isPrimaryLoan,
  primaryLoanServerPath,
  sponsorName,
  parentTreePath,
  uploadedEntries,
  currentUserDetails,
  updateFileStatus,
  updateFolderStatus,
}: UploadFolderNodeParams): Promise<void> => {
  const folderServerPath = `${parentServerRelativePath}/${node.name}`;
  const currentTreePath = parentTreePath
    ? `${parentTreePath}/${node.name}`
    : node.name;

  updateFolderStatus(node.id, { status: "uploading" });

  // ── Upload files in this folder ──
  for (let i = 0; i < node.files.length; i++) {
    const fileNode = node.files[i];
    updateFileStatus(fileNode.id, { status: "uploading" });

    try {
      let result: { Id: number; Path: string };

      if (isPrimaryLoan) {
        result = await uploadSingleFile(
          fileNode.file,
          folderServerPath,
          sponsorName,
        );
      } else {
        console.log("siteUrl", siteUrl);
        console.log("primaryLoanServerPath", primaryLoanServerPath);
        console.log("node.name", node.name);
        console.log("fileNode.file.name", fileNode.file.name);

        const primaryFileAbsoluteUrl = `${siteUrl}${primaryLoanServerPath}/${node.name}/${fileNode.file.name}`;
        result = await createShortcutFile(
          primaryFileAbsoluteUrl,
          fileNode.file.name,
          folderServerPath,
          sponsorName,
        );
      }

      updateFileStatus(fileNode.id, { status: "done", progress: 100 });

      if (!uploadedEntries[loanNumber]) uploadedEntries[loanNumber] = [];

      uploadedEntries[loanNumber].push({
        node: buildFileNode(
          fileNode.file.name,
          result.Id,
          result.Path,
          sponsorName,
          currentUserDetails || { Id: 0, Title: "", Email: "" },
          !isPrimaryLoan,
        ),
        folderPathInTree: currentTreePath,
      });
    } catch (err: any) {
      updateFileStatus(fileNode.id, {
        status: "error",
        error: err?.message || "Upload failed",
      });
    }
  }

  // ── Recurse into sub-folders ──
  for (let j = 0; j < node.subFolders.length; j++) {
    await uploadFolderNodeToLoan({
      node: node.subFolders[j],
      loanNumber,
      parentServerRelativePath: folderServerPath,
      siteUrl,
      isPrimaryLoan,
      primaryLoanServerPath: `${primaryLoanServerPath}/${node.name}`,
      sponsorName,
      parentTreePath: currentTreePath,
      uploadedEntries,
      currentUserDetails,
      updateFileStatus,
      updateFolderStatus,
    });
  }

  updateFolderStatus(node.id, { status: "done", progress: 100 });
};

/** Build the updated Redux tree after all uploads complete */
export const buildUpdatedTree = (
  loansDetails: ILoanTree[],
  uploadedEntries: Record<string, UploadedFileEntry[]>,
  baseFolderPath: string,
): ILoanTree[] => {
  let updatedTree = [...loansDetails];
  const loanNumbers = Object.keys(uploadedEntries);

  for (let k = 0; k < loanNumbers.length; k++) {
    const loanNumber = loanNumbers[k];
    const entries = uploadedEntries[loanNumber];

    // Group by top-level uploaded folder name → list of { parentPath, files }
    const byFolderNode: Record<
      string,
      { parentPath: string; files: ILoanTree[] }[]
    > = {};

    for (let e = 0; e < entries.length; e++) {
      const { node, folderPathInTree } = entries[e];

      const segments = folderPathInTree.split("/").filter(Boolean);
      const baseSegments = baseFolderPath.split("/").filter(Boolean);
      const uploadedSegments = segments.slice(baseSegments.length);
      const topFolderName = uploadedSegments[0];

      if (!byFolderNode[topFolderName]) byFolderNode[topFolderName] = [];

      const existingEntry = byFolderNode[topFolderName].find(
        (e2) => e2.parentPath === folderPathInTree,
      );
      if (existingEntry) {
        existingEntry.files.push(node);
      } else {
        byFolderNode[topFolderName].push({
          parentPath: folderPathInTree,
          files: [node],
        });
      }
    }

    // Insert each top-level folder + its files into the tree
    const topFolderNames = Object.keys(byFolderNode);
    for (let f = 0; f < topFolderNames.length; f++) {
      const topFolderName = topFolderNames[f];
      const allEntries = byFolderNode[topFolderName];

      const directPath = baseFolderPath
        ? `${baseFolderPath}/${topFolderName}`
        : topFolderName;

      const directFiles = allEntries
        .filter((e2) => e2.parentPath === directPath)
        .flatMap((e2) => e2.files);

      // Insert the folder node with its direct files
      updatedTree = insertFolderNodeIntoTree(
        updatedTree,
        loanNumber,
        baseFolderPath,
        topFolderName,
        directFiles,
      );

      // Insert sub-folder files at their exact paths
      const subEntries = allEntries.filter(
        (e2) => e2.parentPath !== directPath,
      );
      for (let s = 0; s < subEntries.length; s++) {
        updatedTree = insertFilesIntoTree(
          updatedTree,
          loanNumber,
          subEntries[s].parentPath,
          subEntries[s].files,
        );
      }
    }
  }

  return updatedTree;
};
