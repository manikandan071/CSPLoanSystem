import * as React from "react";
import * as ReactDom from "react-dom";
import { Version } from "@microsoft/sp-core-library";
import {
  type IPropertyPaneConfiguration,
  PropertyPaneTextField,
} from "@microsoft/sp-property-pane";
import { BaseClientSideWebPart } from "@microsoft/sp-webpart-base";
// import { IReadonlyTheme } from '@microsoft/sp-component-base';
import { sp } from "@pnp/sp/presets/all";
import { graph } from "@pnp/graph/presets/all";
import * as strings from "LoansystemWebPartStrings";
import { SPComponentLoader } from "@microsoft/sp-loader";
import Loansystem from "./components/Loansystem";
import { ILoansystemProps } from "./components/ILoansystemProps";
require("../../../node_modules/primereact/resources/themes/bootstrap4-light-blue/theme.css");
export interface ILoansystemWebPartProps {
  description: string;
}

export default class LoansystemWebPart extends BaseClientSideWebPart<ILoansystemWebPartProps> {
  public async onInit(): Promise<void> {
    SPComponentLoader.loadCss("https://unpkg.com/primeicons/primeicons.css");
    sp.setup({
      spfxContext: this.context as unknown as undefined,
    });

    // Set up Graph context
    graph.setup({
      spfxContext: this.context as unknown as undefined,
    });

    await super.onInit();
  }

  public render(): void {
    const element: React.ReactElement<ILoansystemProps> = React.createElement(
      Loansystem,
      {
        context: this.context,
      }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse("1.0");
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription,
          },
          groups: [
            {
              groupName: strings.BasicGroupName,
              groupFields: [
                PropertyPaneTextField("description", {
                  label: strings.DescriptionFieldLabel,
                }),
              ],
            },
          ],
        },
      ],
    };
  }
}
