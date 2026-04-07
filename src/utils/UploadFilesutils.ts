// treeUpdateUtils.ts

import { IUserDetails } from "../interfaces/common";
import { ILoanTree } from "../interfaces/loandocument";
import { formatDate } from "./CommonUtils";

// Build a new ILoanTree file node after upload
export const buildFileNode = (
  fileName: string,
  id: number,
  path: string,
  sponsor: string,
  currentUserDetails: IUserDetails,
  isShortcut = false,
): ILoanTree => ({
  name: isShortcut ? `${fileName.replace(/\./g, "-")}.url` : fileName,
  Path: path,
  Id: id,
  isFile: true,
  SubFolders: [],
  Sponsor: sponsor,
  AssetManagement: [],
  Servicing: [],
  Legal: [],
  CreatedBy: currentUserDetails,
  CreatedByTitle: currentUserDetails.Title,
  ModifiedBy: currentUserDetails,
  Created: formatDate(new Date().toISOString()),
  Modified: formatDate(new Date().toISOString()),
});

// Recursively walk path segments and insert at the deepest level
const insertFilesAtPath = (
  nodes: ILoanTree[],
  pathSegments: string[],
  newFiles: ILoanTree[],
): ILoanTree[] => {
  if (pathSegments.length === 0) {
    // At target folder — append new file nodes (avoid duplicates by name)
    const existingNames = new Set(nodes.map((n) => n.name));
    const toAdd = newFiles.filter((f) => !existingNames.has(f.name));
    return [...nodes, ...toAdd];
  }

  const [current, ...rest] = pathSegments;

  return nodes.map((node) => {
    if (node.name === current) {
      return {
        ...node,
        SubFolders: insertFilesAtPath(node.SubFolders ?? [], rest, newFiles),
      };
    }
    return node;
  });
};

// Insert file nodes into the correct loan → folderPath location in the tree
export const insertFilesIntoTree = (
  nodes: ILoanTree[],
  loanName: string, // e.g. "3000101"
  folderPath: string, // e.g. "Notable Cases" or "Asset Management/Underwriting"
  newFiles: ILoanTree[],
): ILoanTree[] => {
  return nodes.map((node) => {
    // Match the loan root node
    if (node.name === loanName) {
      return {
        ...node,
        SubFolders: insertFilesAtPath(
          node.SubFolders ?? [],
          folderPath.split("/").filter(Boolean),
          newFiles,
        ),
      };
    }
    return node;
  });
};
