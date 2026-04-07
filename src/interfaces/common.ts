import { ILoanTree, ISponsor } from "./loandocument";

export interface IUserDetails {
  Id: number;
  Title: string;
  Email: string;
}

export interface ITermset {
  Label: string;
  TermGuid: string;
  WssId: number;
}
export interface ITempSponsor {
  name: string;
}

export interface IOptions {
  key: string;
  text: string;
}

export interface ITermMap {
  [key: string]: ITermset[];
}

export interface ITermOptions {
  [key: string]: IOptions[];
}

export interface ILoanDetailsState {
  loansDetails: ILoanTree[];
  tempSponsorDetails: ITempSponsor[];
  sponsorDetails: ISponsor[];
  termMap: ITermMap;
  termsOptions: ITermOptions;
}

export interface ICommonDetailsState {
  currentUserDetails: IUserDetails;
}

export interface RootState {
  LoanDetailsContext: ILoanDetailsState;
  CommonDetailsContext: ICommonDetailsState;
}
