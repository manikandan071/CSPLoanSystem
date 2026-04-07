import { sp } from "@pnp/sp";

// ── Static Folder Structure ───────────────────────────────
export const FOLDER_TREE = [
  {
    label: "Asset Management",
    value: "Asset Management",
    children: [
      {
        label: "Financials and Rent Rolls",
        value: "Asset Management/Financials and Rent Rolls",
        children: [],
      },
      {
        label: "Borrower Contact Sheets",
        value: "Asset Management/Borrower Contact Sheets",
        children: [],
      },
      {
        label: "Inspections + Enviro Reports",
        value: "Asset Management/Inspections + Enviro Reports",
        children: [],
      },
      {
        label: "Underwriting",
        value: "Asset Management/Underwriting",
        children: [],
      },
    ],
  },
  {
    label: "Custodian",
    value: "Custodian",
    children: [],
  },
  {
    label: "CSP Legal",
    value: "CSP Legal",
    children: [
      {
        label: "Acceleration",
        value: "CSP Legal/Acceleration",
        children: [
          {
            label: "Servicing Accel Package",
            value: "CSP Legal/Acceleration/Servicing Accel Package",
            children: [],
          },
        ],
      },
      {
        label: "FDIC Mod",
        value: "CSP Legal/FDIC Mod",
        children: [
          {
            label: "Closing Docs",
            value: "CSP Legal/FDIC Mod/Closing Docs",
            children: [],
          },
          {
            label: "Closing Supporting Docs",
            value: "CSP Legal/FDIC Mod/Closing Supporting Docs",
            children: [],
          },
          {
            label: "Business Diligence",
            value: "CSP Legal/FDIC Mod/Business Diligence",
            children: [],
          },
        ],
      },
      { label: "Foreclosure", value: "CSP Legal/Foreclosure", children: [] },
      {
        label: "Pre Negotiation Agreements",
        value: "CSP Legal/Pre Negotiation Agreements",
        children: [],
      },
      {
        label: "Servicing Mod",
        value: "CSP Legal/Servicing Mod",
        children: [],
      },
    ],
  },
  {
    label: "Servicing",
    value: "Servicing",
    children: [
      {
        label: "Insurance Compliance",
        value: "Servicing/Insurance Compliance",
        children: [],
      },
    ],
  },
  {
    label: "Notable Cases",
    value: "Notable Cases",
    children: [],
  },
];

// ── Parse filename to extract loan number + folder path ───
export const parseFileName = (
  fileName: string,
): {
  loanNumber: string | null;
  folderPath: string | null;
  cleanName: string;
} => {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
  const parts = nameWithoutExt.split("_");

  if (parts.length >= 3) {
    const loanNumber = parts[0];
    const remaining = parts.slice(1);
    const folderParts = remaining.slice(0, -1);
    const cleanName = remaining[remaining.length - 1];
    const folderPath = folderParts.join("/");

    if (/^\d{5,}$/.test(loanNumber)) {
      return {
        loanNumber,
        folderPath,
        cleanName: cleanName + "." + fileName.split(".").pop(),
      };
    }
  }

  return { loanNumber: null, folderPath: null, cleanName: fileName };
};

// ── Upload file to SharePoint ─────────────────────────────
export const uploadFileToSharePoint = async (
  libraryName: string,
  loanNumber: string,
  folderPath: string,
  file: File,
): Promise<void> => {
  const targetFolder = `${libraryName}/${loanNumber}/${folderPath}`;
  await sp.web.folders.add(targetFolder);
  const folder = sp.web.getFolderByServerRelativeUrl(targetFolder);
  await folder.files.add(file.name, file, true);
};

// ── Create shortcut in SharePoint ────────────────────────
export const createShortcutInLoan = async (
  libraryName: string,
  sourceLoanNumber: string,
  folderPath: string,
  fileName: string,
  targetLoanNumber: string,
): Promise<void> => {
  const webInfo = await sp.web.select("Url")();
  const siteUrl = webInfo.Url;

  const sourceUrl = `${siteUrl}/${libraryName}/${sourceLoanNumber}/${folderPath}/${fileName}`;
  const targetFolder = `${libraryName}/${targetLoanNumber}/${folderPath}`;

  await sp.web.folders.add(targetFolder);

  const shortcutContent = [
    "[InternetShortcut]",
    `URL=${sourceUrl}`,
    "IDList=",
    "HotKey=0",
    "InternalName=",
    "IconIndex=1",
    "IconFile=",
  ].join("\r\n");

  const shortcutBlob = new Blob([shortcutContent], { type: "text/plain" });

  // ✅ Use a safe shortcut name — replace dots with dashes in display name only
  // but keep the .url extension clearly separated
  const baseName = fileName.replace(/\./g, "-"); // Configuration.gif → Configuration-gif
  const shortcutFileName = `${baseName}.url`; // Configuration-gif.url

  const shortcutFile = new File([shortcutBlob], shortcutFileName);

  const folder = sp.web.getFolderByServerRelativeUrl(targetFolder);

  // ✅ Pass filename explicitly in add() to avoid SharePoint mangling it
  await folder.files.add(shortcutFileName, shortcutFile, true);
};

export type UploadMode = "single" | "multi-loan" | "sponsor" | "all";

export interface FileUploadItem {
  id: string;
  file: File;
  loanNumber: string | null;
  folderPath: string | null;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  progress: number;
  // Per-file mode
  uploadMode: UploadMode;
  selectedLoan: string | null;
  selectedLoans: string[];
  selectedSponsor: string | null;
}
