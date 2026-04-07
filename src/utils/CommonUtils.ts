import { sp } from "@pnp/sp/presets/all";
import * as dayjs from "dayjs";
import { ILoanTree } from "../interfaces/loandocument";

export const isRecentlyCreated = (createdDate: string): boolean => {
  return dayjs(new Date()).format("DD/MM/YYYY") === createdDate;
};

export const formatDate = (dateString: string): string => {
  return dayjs(dateString).isValid()
    ? dayjs(dateString).format("DD/MM/YYYY")
    : "-";
};

/**
 * Parses a date string formatted as "DD/MM/YYYY" into a numeric timestamp.
 * Returns 0 for empty or invalid values so sorting degrades gracefully.
 */
export const parseDDMMYYYY = (value: string): number => {
  if (!value) return 0;
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day).getTime();
};

/**
 * Returns the SharePoint user-photo URL for a given email address.
 */
export const getUserPhotoUrl = (email: string): string =>
  `/_layouts/15/userphoto.aspx?size=S&username=${email}`;

/** Generates a short random alphanumeric id. */
export const generateId = (): string => Math.random().toString(36).slice(2, 9);

/** Formats a byte count into a human-readable string (B / KB / MB / GB). */
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const resolveShortcutNode = async (
  node: ILoanTree,
): Promise<ILoanTree> => {
  if (!node.name.endsWith(".url")) return node;
  debugger;

  try {
    // Read the .url file content from SharePoint using the node's Path
    const fileContent = await sp.web
      .getFileByServerRelativePath(node.Path)
      .getText();

    // Extract URL= line from shortcut content
    const match = fileContent.match(/^URL=(.+)$/m);
    if (!match) return node;

    const sourceAbsoluteUrl = match[1].trim();
    // e.g. "https://tenant.sharepoint.com/sites/CSPTestLoantContent/LoanLibrary/3000101/Notable Cases/Configuration.gif"

    // Convert absolute URL → server-relative path
    const webInfo = await sp.web.select("Url")();
    const siteUrl = webInfo.Url;
    const sourcePath = sourceAbsoluteUrl.replace(siteUrl, "");
    // e.g. "/LoanLibrary/3000101/Notable Cases/Configuration.gif"

    return {
      ...node,
      Path: sourcePath,
    };
  } catch (err) {
    console.error("❌ Error resolving shortcut node:", err);
    return node;
  }
};

export const getSourceUrlFromShortcut = async (
  filePath: string,
): Promise<string | null> => {
  try {
    // Get file
    const file = sp.web.getFileByServerRelativeUrl(filePath);

    // Get file content as text
    const fileBuffer = await file.getBuffer();
    const fileText = new TextDecoder().decode(fileBuffer);

    // Extract URL line
    const match = fileText.match(/URL=(.*)/);

    if (match && match[1]) {
      return match[1].trim();
    }

    return null;
  } catch (error) {
    console.error("Error reading shortcut file:", error);
    return null;
  }
};
