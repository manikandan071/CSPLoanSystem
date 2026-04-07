// uploadService.ts
import { sp } from "@pnp/sp/presets/all";
import { LIBRARIES } from "../../constants/constants";

const SPONSOR_FIELD = "Sponsor";

export const uploadFileToSharePoint = async (
  libraryName: string,
  loanNumber: string,
  folderPath: string, // e.g. "Notable Cases"
  sponsorName: string,
  file: File,
): Promise<{ Id: number; Path: string }> => {
  const webInfo = await sp.web.select("Url", "ServerRelativeUrl")();
  const serverRelativeUrl = webInfo.ServerRelativeUrl.replace(/\/$/, "");
  const targetFolder = `${serverRelativeUrl}/${libraryName}/${loanNumber}/${folderPath}`;

  const uploaded = await sp.web
    .getFolderByServerRelativeUrl(targetFolder)
    .files.add(file.name, file, true);

  const item = await uploaded.file.getItem<{ Id: number; FileRef: string }>(
    "Id",
    "FileRef",
  );

  await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(item.Id)
    .update({
      [SPONSOR_FIELD]: sponsorName,
      Title: file.name,
    });

  return { Id: item.Id, Path: item.FileRef };
};

export const createShortcutInLoan = async (
  libraryName: string,
  sourceLoanNumber: string,
  folderPath: string,
  fileName: string,
  sponsorName: string,
  targetLoanNumber: string,
): Promise<{ Id: number; Path: string }> => {
  const webInfo = await sp.web.select("Url", "ServerRelativeUrl")();
  const siteUrl = webInfo.Url;
  const serverRelativeUrl = webInfo.ServerRelativeUrl.replace(/\/$/, "");

  const sourceUrl = `${siteUrl}/${libraryName}/${sourceLoanNumber}/${folderPath}/${fileName}`;
  const targetFolder = `${serverRelativeUrl}/${libraryName}/${targetLoanNumber}/${folderPath}`;

  await sp.web.folders.add(targetFolder);

  const baseName = fileName.replace(/\./g, "-");
  const shortcutFileName = `${baseName}.url`;

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
  const shortcutFile = new File([shortcutBlob], shortcutFileName);

  const folder = sp.web.getFolderByServerRelativeUrl(targetFolder);
  const uploaded = await folder.files.add(shortcutFileName, shortcutFile, true);

  const item = await uploaded.file.getItem<{ Id: number; FileRef: string }>(
    "Id",
    "FileRef",
  );
  await sp.web.lists
    .getByTitle(LIBRARIES.LOAN_DISPLAY_NAME)
    .items.getById(item.Id)
    .update({
      [SPONSOR_FIELD]: sponsorName,
      Title: fileName,
    });

  return { Id: item.Id, Path: sourceUrl };
};
