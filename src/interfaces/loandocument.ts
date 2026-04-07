/* eslint-disable @typescript-eslint/no-explicit-any */
import { ITermset, IUserDetails } from "./common";

export interface ILoanSPitem {
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

export interface ILoanTree {
  name: string;
  Path: string;
  Id: number;
  isFile: boolean;
  SubFolders: ILoanTree[];
  Sponsor: string;
  AssetManagement: ITermset[];
  Servicing: ITermset[];
  Legal: ITermset[];
  CreatedBy: IUserDetails;
  CreatedByTitle: string;
  ModifiedBy: IUserDetails;
  Created: string;
  Modified: string;
}

// export interface Sponsor {
//   id: string;
//   name: string;
// }

export interface ISponsor {
  Id: number;
  Title: string;
  Description?: string;
  Loans: ILoanTree[];
}

export interface UploadFile {
  file: File;
  id: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

export interface NavigationItem {
  name: string;
  Path: string;
}

export interface SponsorLoan {
  sponsor: string;
  loanNumber: string;
  basePath: string;
}

export interface CreateUploadMenuProps {
  navigationStack: NavigationItem[];
  currentSponsor: string | undefined;
  allSponsorLoans?: SponsorLoan[];
}

// folder upload types

export interface FolderUploadModalProps {
  onClose: () => void;
  currentPath: string;
  currentSponsor?: string;
  allSponsorLoans?: SponsorLoan[];
}

export interface FolderNode {
  id: string;
  name: string;
  relativePath: string;
  files: FileNode[];
  subFolders: FolderNode[];
  expanded: boolean;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
}

export interface FileNode {
  id: string;
  file: File;
  relativePath: string;
  status: "pending" | "uploading" | "done" | "error";
  progress: number;
  error?: string;
}

export interface UploadedFileEntry {
  node: ILoanTree;
  folderPathInTree: string;
}

export interface FolderTreeNodeProps {
  node: FolderNode;
  depth?: number;
  onRemoveFile: (folderId: string, fileId: string) => void;
  onRemoveFolder: (folderId: string) => void;
  onToggle: (folderId: string) => void;
}
