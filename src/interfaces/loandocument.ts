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
  Id: number;
  isFile: boolean;
  SubFolders: ILoanTree[];
  Sponsor: string;
  AssetManagement: ITermset[];
  Servicing: ITermset[];
  Legal: ITermset[];
  CreatedBy: IUserDetails;
  CreatedByTitle: string;
  ModifiedBy: ILoanTree;
  Created: string;
  Modified: string;
}
