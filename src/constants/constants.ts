import * as React from "react";
import { Building2, FolderPlus, FilePlus2, FolderUp } from "lucide-react";
import { ModalType } from "../types/loan.types";

// ─── Dropdown menu items ──────────────────────────────────────────────────────

export interface MenuItem {
  key: Exclude<ModalType, undefined>;
  icon: React.ReactNode;
  label: string;
  description: string;
}

export const MENU_ITEMS: MenuItem[] = [
  {
    key: "loan",
    icon: React.createElement(Building2, { size: 16 }),
    label: "New Loan",
    description: "Create loan + folder structure",
  },
  {
    key: "folder",
    icon: React.createElement(FolderPlus, { size: 16 }),
    label: "Folder",
    description: "Add folder here",
  },
  {
    key: "files",
    icon: React.createElement(FilePlus2, { size: 16 }),
    label: "Files upload",
    description: "Upload files",
  },
  {
    key: "folderUpload",
    icon: React.createElement(FolderUp, { size: 16 }),
    label: "Folder upload",
    description: "Upload an entire folder",
  },
];

// ─── Static loan folder structure ────────────────────────────────────────────

export const buildLoanFolderStructure = (loanNumber: string): string[] => [
  loanNumber,
  `${loanNumber}/Asset Management`,
  `${loanNumber}/Asset Management/Financials and Rent Rolls`,
  `${loanNumber}/Asset Management/Borrower Contact Sheets`,
  `${loanNumber}/Asset Management/Inspections + Enviro Reports`,
  `${loanNumber}/Asset Management/Underwriting`,
  `${loanNumber}/Custodian`,
  `${loanNumber}/CSP Legal`,
  `${loanNumber}/CSP Legal/Acceleration`,
  `${loanNumber}/CSP Legal/Acceleration/Servicing Accel Package`,
  `${loanNumber}/CSP Legal/FDIC Mod`,
  `${loanNumber}/CSP Legal/FDIC Mod/Closing Docs`,
  `${loanNumber}/CSP Legal/FDIC Mod/Closing Supporting Docs`,
  `${loanNumber}/CSP Legal/FDIC Mod/Business Diligence`,
  `${loanNumber}/CSP Legal/Foreclosure`,
  `${loanNumber}/CSP Legal/Pre Negotiation Agreements`,
  `${loanNumber}/CSP Legal/Servicing Mod`,
  `${loanNumber}/Servicing`,
  `${loanNumber}/Servicing/Insurance Compliance`,
  `${loanNumber}/Notable Cases`,
];

// list and library names

export const LIBRARIES = {
  LOAN_DISPLAY_NAME: "CSP Loan Files",
  LOAN_INTERNAL_NAME: "exchange",
};
