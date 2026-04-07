import * as React from "react";
import type { ILoansystemProps } from "./ILoansystemProps";
import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";
import { Provider } from "react-redux";
import { store } from "../../../redux/store/Store";
import MainComponent from "./MainComponent";
import "../assets/css/style.css";
import "../assets/css/variables.css";
import "../assets/css/common.css";
import "../assets/css/font.css";
import "antd/dist/antd.css";
// import { DocumentNotificationComponent } from "./SentMail/DocumentNotificationComponent";

export default class Loansystem extends React.Component<ILoansystemProps, {}> {
  constructor(prop: ILoansystemProps) {
    super(prop);
    sp.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
    graph.setup({
      spfxContext: this.props.context as unknown as undefined,
    });
  }
  public render(): React.ReactElement<ILoansystemProps> {
    // const sampleDocument = {
    //   name: "Q4 Financial Report.pdf",
    //   url: "https://yourtenant.sharepoint.com/sites/documents/Shared%20Documents/Q4%20Financial%20Report.pdf",
    //   submittedBy: "John Doe",
    // };

    // const approvers = [
    //   { email: "Leowilson@chandrudemo.onmicrosoft.com", name: "Leo Wilson" },
    //   { email: "Kawin@chandrudemo.onmicrosoft.com", name: "Kawin V" },
    // ];
    return (
      <Provider store={store}>
        <div>
          {/* <DocumentNotificationComponent
          context={this.props.context}
          approvers={approvers}
          document={sampleDocument}
        /> */}
          <MainComponent />
        </div>
      </Provider>
    );
  }
}
