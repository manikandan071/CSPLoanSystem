import { FileNode, FolderNode, ILoanTree } from "../interfaces/loandocument";
import { generateId } from "./CommonUtils";

const insertFolderAtPath = (
  nodes: ILoanTree[],
  pathSegments: string[], // remaining segments to walk
  newFolderName: string,
  fileNodes: ILoanTree[],
): ILoanTree[] => {
  // Reached the target parent — append the new folder node here
  if (pathSegments.length === 0) {
    const alreadyExists = nodes.find((n) => n.name === newFolderName);
    if (alreadyExists) {
      // Folder exists — just merge files into it
      return nodes.map((n) =>
        n.name === newFolderName
          ? {
              ...n,
              SubFolders: [
                ...(n.SubFolders ?? []),
                ...fileNodes.filter(
                  (f) => !(n.SubFolders ?? []).find((e) => e.name === f.name),
                ),
              ],
            }
          : n,
      );
    }

    // ✅ Insert brand new folder node with files inside
    const newFolderNode: ILoanTree = {
      name: newFolderName,
      Path: "",
      Id: 0,
      isFile: false,
      SubFolders: fileNodes,
      Sponsor: fileNodes[0]?.Sponsor ?? "",
      AssetManagement: [],
      Servicing: [],
      Legal: [],
      CreatedBy: fileNodes[0]?.CreatedBy ?? null,
      CreatedByTitle: fileNodes[0]?.CreatedByTitle ?? "",
      ModifiedBy: fileNodes[0]?.ModifiedBy ?? null,
      Created: fileNodes[0]?.Created ?? "",
      Modified: fileNodes[0]?.Modified ?? "",
    };

    return [...nodes, newFolderNode];
  }

  // Keep walking down the path
  const [current, ...rest] = pathSegments;
  return nodes.map((n) =>
    n.name === current
      ? {
          ...n,
          SubFolders: insertFolderAtPath(
            n.SubFolders ?? [],
            rest,
            newFolderName,
            fileNodes,
          ),
        }
      : n,
  );
};

// ✅ Add this new helper to UploadFilesutils.ts
export const insertFolderNodeIntoTree = (
  nodes: ILoanTree[],
  loanName: string, // "3000101"
  parentFolderPath: string, // "Notable Cases" — where to insert the new folder
  newFolderName: string, // "new folder"
  fileNodes: ILoanTree[], // files inside the folder
): ILoanTree[] => {
  return nodes.map((node) => {
    if (node.name !== loanName) return node;

    // Walk to the parent folder inside this loan
    return {
      ...node,
      SubFolders: insertFolderAtPath(
        node.SubFolders ?? [],
        parentFolderPath.split("/").filter(Boolean),
        newFolderName,
        fileNodes,
      ),
    };
  });
};

/** Build a nested FolderNode tree from a flat FileList (webkitRelativePath) */
export const buildFolderTree = (files: FileList): FolderNode[] => {
  const rootMap: Record<string, FolderNode> = {};

  Array.from(files).forEach((file) => {
    const parts = file.webkitRelativePath.split("/");
    const rootName = parts[0];

    if (!rootMap[rootName]) {
      rootMap[rootName] = {
        id: generateId(),
        name: rootName,
        relativePath: rootName,
        files: [],
        subFolders: [],
        expanded: true,
        status: "pending",
        progress: 0,
      };
    }

    let current = rootMap[rootName];
    for (let i = 1; i < parts.length - 1; i++) {
      const segName = parts[i];
      let sub = current.subFolders.find((s) => s.name === segName);
      if (!sub) {
        sub = {
          id: generateId(),
          name: segName,
          relativePath: parts.slice(0, i + 1).join("/"),
          files: [],
          subFolders: [],
          expanded: true,
          status: "pending",
          progress: 0,
        };
        current.subFolders.push(sub);
      }
      current = sub;
    }

    current.files.push({
      id: generateId(),
      file,
      relativePath: file.webkitRelativePath,
      status: "pending",
      progress: 0,
    });
  });

  return Object.values(rootMap);
};

/** Count total files in a FolderNode tree */
export const countFiles = (folders: FolderNode[]): number =>
  folders.reduce(
    (acc, f) => acc + f.files.length + countFiles(f.subFolders),
    0,
  );

/** Remove a file recursively from FolderNode tree */
export const removeFileFromTree = (
  nodes: FolderNode[],
  folderId: string,
  fileId: string,
): FolderNode[] =>
  nodes.map((n) => {
    if (n.id === folderId) {
      return { ...n, files: n.files.filter((f) => f.id !== fileId) };
    }
    return {
      ...n,
      subFolders: removeFileFromTree(n.subFolders, folderId, fileId),
    };
  });

/** Update a file's status recursively */
export const patchFileStatus = (
  nodes: FolderNode[],
  fileId: string,
  update: Partial<FileNode>,
): FolderNode[] =>
  nodes.map((n) => ({
    ...n,
    files: n.files.map((f) => (f.id === fileId ? { ...f, ...update } : f)),
    subFolders: patchFileStatus(n.subFolders, fileId, update),
  }));

/** Update a folder's status recursively */
export const patchFolderStatus = (
  nodes: FolderNode[],
  folderId: string,
  update: Partial<FolderNode>,
): FolderNode[] =>
  nodes.map((n) =>
    n.id === folderId
      ? { ...n, ...update }
      : { ...n, subFolders: patchFolderStatus(n.subFolders, folderId, update) },
  );

/** Toggle expand/collapse on a folder */
export const toggleFolderExpanded = (
  nodes: FolderNode[],
  folderId: string,
): FolderNode[] =>
  nodes.map((n) =>
    n.id === folderId
      ? { ...n, expanded: !n.expanded }
      : { ...n, subFolders: toggleFolderExpanded(n.subFolders, folderId) },
  );
