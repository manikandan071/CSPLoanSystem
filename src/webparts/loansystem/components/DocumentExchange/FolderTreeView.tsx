/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import { memo, useState } from "react";
import { Dialog } from "primereact/dialog";
import { MultiSelect } from "primereact/multiselect";
import { Button } from "primereact/button";
import styles from "./FolderTreeView.module.scss";
import { FaTag } from "react-icons/fa6";
import { FcFolder } from "react-icons/fc";
import { FcOpenedFolder } from "react-icons/fc";

import "../../assets/css/custom.css";
import { sp } from "@pnp/sp";
interface TreeNode {
  Id: number;
  name: string;
  Path: string;
  children?: { [key: string]: TreeNode };
  isFile?: boolean;
  Sponsor?: string;
  AssetManagement?: any[];
  Servicing?: any[];
  Legal?: any[];
}

interface FolderTreeProps {
  node: TreeNode;
  options: any;
  termsDeatils: any;
  updateLoanData: any;
  level?: number;
}

const getLevelClass = (level: number) => {
  const key = `level${level}` as keyof typeof styles;
  return styles[key] || "";
};

const FolderTreeView: React.FC<FolderTreeProps> = memo(
  ({ node, level = 0, options, termsDeatils, updateLoanData }) => {
    const [open, setOpen] = useState(false);
    const hasChildren = node.children && Object.keys(node.children).length > 0;
    const [visible, setVisible] = useState(false);
    const [formData, setFormData] = useState({
      Id: null as number | null,
      LoanNumber: "",
      Path: "",
      AssetManagement: [] as any[],
      Legal: [] as any[],
      Servicing: [] as any[],
    });
    console.log("formData", formData);

    const toggle = () => {
      if (hasChildren) setOpen(!open);
    };

    const bindTermsToValues = (selectedTerms: any[]) => {
      let termsString = "";
      selectedTerms.forEach((label) => {
        const cleanLabel = label.replace(/^#+/, "").trim(); // remove leading '#'
        const guid = termsDeatils[cleanLabel];
        if (!guid) {
          console.warn("⚠️ Term not found in map:", cleanLabel);
          return;
        }
        termsString += `-1;#${cleanLabel}|${guid};#`;
      });
      return termsString;
    };

    const updateRecord = async () => {
      if (formData.Id !== null) {
        // Perform update operation here
        console.log("Updating record with ID:", formData.Id);
        console.log("New Asset Management:", formData.AssetManagement);
        console.log("New Legal:", formData.Legal);
        console.log("New Servicing:", formData.Servicing);
        const payload: any = {};
        // const payload: any = {
        //   AssetManagement: bindTermsToValues(formData.AssetManagement),
        //   Legal: bindTermsToValues(formData.Legal),
        //   Servicing: bindTermsToValues(formData.Servicing),
        // };

        const list = sp.web.lists.getByTitle("CSP Loan Files");
        const assetfield = await list.fields
          .getByTitle(`AssetManagement_0`)
          .get();
        const servicingfield = await list.fields
          .getByTitle(`Servicing_0`)
          .get();
        const legalfield = await list.fields.getByTitle(`Legal_0`).get();

        payload[assetfield.InternalName] = bindTermsToValues(
          formData.AssetManagement
        );
        payload[servicingfield.InternalName] = bindTermsToValues(
          formData.Servicing
        );
        payload[legalfield.InternalName] = bindTermsToValues(formData.Legal);

        list.items
          .getById(formData.Id)
          .update(payload)
          .then((res) => {
            console.log("Record updated successfully:", res);
            const updatedAssetManagement = formData.AssetManagement.map(
              (label) => {
                const cleanLabel = label.replace(/^#+/, "").trim();
                return { Label: cleanLabel };
              }
            );
            const updatedServicing = formData.Servicing.map((label) => {
              const cleanLabel = label.replace(/^#+/, "").trim();
              return { Label: cleanLabel };
            });
            const updatedLegal = formData.Legal.map((label) => {
              const cleanLabel = label.replace(/^#+/, "").trim();
              return { Label: cleanLabel };
            });
            updateLoanData(formData.Id, {
              AssetManagement: updatedAssetManagement,
              Servicing: updatedServicing,
              Legal: updatedLegal,
            });
          })
          .catch((error) => {
            console.log("Error updating record:", error);
          });

        // sp.web.lists
        //   .getByTitle("CSP Loan Files")
        //   .items.getById(formData.Id)
        //   .update(payload)
        //   .then((res) => {
        //     console.log("Record updated successfully:", res);
        //   })
        //   .catch((error) => {
        //     console.log("Error updating record:", error);
        //   });

        setVisible(false);
      }
    };

    const footerContent = (
      <div className="footer-btn">
        <Button
          className="cancel-button btn"
          label="Cancel"
          onClick={() => setVisible(false)}
        />
        <Button
          className="update-button btn"
          label="Update"
          onClick={() => {
            updateRecord();
          }}
          autoFocus
        />
      </div>
    );

    return (
      <div className={styles.folderTree}>
        <div
          className={`${styles.treeItem} ${
            node.isFile ? styles.file : styles.folder
          } ${getLevelClass(level)}`}
        >
          <div
            style={{
              padding: `10px 10px 10px ${level * 20 + 10}px`,
              width: "30%",
              display: "flex",
              alignItems: "center",
              fontSize: node.isFile ? "13px" : "14px",
            }}
            onClick={toggle}
          >
            {hasChildren ? (
              <i
                className={`pi ${open ? "pi-angle-down" : "pi-angle-right"} ${
                  styles.toggleIcon
                }`}
                style={{ marginRight: "10px" }}
              />
            ) : (
              <span className={styles.togglePlaceholder} />
            )}
            {/* <i
              className={`pi ${
                node.isFile ? "pi-file" : open ? "pi-folder-open" : "pi-folder"
              } ${styles.folderIcon}`}
            /> */}
            {node.isFile ? (
              <i className={`pi pi-file ${styles.folderIcon}`} />
            ) : open ? (
              // <FcFolder style={{ marginRight: "8px" }} />
              React.createElement(FcOpenedFolder as any, {
                style: { marginRight: "5px", fontSize: "19px" },
              })
            ) : (
              // <FcFolder style={{ marginRight: "8px" }} />
              React.createElement(FcFolder as any, {
                style: { marginRight: "5px", fontSize: "19px" },
              })
            )}
            <span className={styles.itemName}>{node.name}</span>
          </div>
          <div
            className={styles.sponsorName}
            style={{ width: "10%", padding: "5px" }}
          >
            {node.Sponsor}
          </div>
          <div
            style={{ width: "20%", padding: "5px" }}
            className={styles.tagsList}
          >
            {node.AssetManagement?.map((am, idx) => (
              <span key={idx} className={styles.termChip}>
                {React.createElement(FaTag as any, {
                  style: { fontSize: "9px", color: "#0a2e5c" },
                })}
                {am?.Label}
              </span>
            ))}
          </div>
          <div
            style={{ width: "20%", padding: "5px" }}
            className={styles.tagsList}
          >
            {node.Servicing?.map((sv, idx) => (
              <span key={idx} className={styles.termChip}>
                {React.createElement(FaTag as any, {
                  style: { fontSize: "9px", color: "#0a2e5c" },
                })}
                {sv?.Label}
              </span>
            ))}
          </div>
          <div
            style={{ width: "15%", padding: "5px" }}
            className={styles.tagsList}
          >
            {node.Legal?.map((lg, idx) => (
              <span key={idx} className={styles.termChip}>
                {React.createElement(FaTag as any, {
                  style: { fontSize: "9px", color: "#0a2e5c" },
                })}
                {lg?.Label}
              </span>
            ))}
          </div>
          <div style={{ width: "5%", padding: "5px" }}>
            <i
              className="pi pi-file-edit"
              onClick={() => {
                setVisible(true);
                setFormData({
                  Id: node.Id,
                  Path: node.Path?.split("/exchange/")[1].replace(/\//g, " / "),
                  LoanNumber: node.Path?.split("/exchange/")[1]?.split("/")[0],
                  AssetManagement:
                    node.AssetManagement?.map((obj) => obj?.Label) || [],
                  Legal: node.Legal?.map((obj) => obj?.Label) || [],
                  Servicing: node.Servicing?.map((obj) => obj?.Label) || [],
                });
              }}
            />
          </div>
        </div>

        {open && hasChildren && (
          <div className={styles.children}>
            {Object.entries(node.children!).map(([key, child]) => (
              <FolderTreeView
                key={key}
                node={child}
                level={level + 1}
                options={options}
                termsDeatils={termsDeatils}
                updateLoanData={updateLoanData}
              />
            ))}
          </div>
        )}
        <Dialog
          header="Update Metadata"
          visible={visible}
          position={"right"}
          style={{ width: "50vw" }}
          onHide={() => {
            if (!visible) return;
            setVisible(false);
          }}
          footer={footerContent}
          draggable={false}
          resizable={false}
        >
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ width: "100%" }}>
              <label className={styles.labeltext}>Loan Number</label>
              <div
                style={{
                  fontSize: "14px",
                  color: "#082c53",
                  fontWeight: "500",
                }}
              >
                {formData.LoanNumber}
              </div>
            </div>
            <div style={{ width: "100%" }}>
              <label className={styles.labeltext}>Path</label>
              <div
                style={{
                  fontSize: "14px",
                  color: "#082c53",
                  fontWeight: "500",
                }}
              >
                {formData.Path}
              </div>
            </div>
            <div style={{ width: "100%" }}>
              <label className={styles.labeltext}>Asset Management</label>
              <MultiSelect
                value={formData.AssetManagement}
                options={options?.AssetManagement || []}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    AssetManagement: e.value,
                  }));
                }}
                optionLabel="label"
                display="chip"
                placeholder="Select Asset Management"
                optionGroupLabel="label"
                optionGroupChildren="items"
                filter
              />
            </div>
            <div style={{ width: "100%" }}>
              <label className={styles.labeltext}>Servicing</label>
              <MultiSelect
                value={formData.Servicing}
                options={options?.Servicing || []}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    Servicing: e.value,
                  }));
                }}
                optionLabel="label"
                display="chip"
                placeholder="Select Servicing"
                optionGroupLabel="label"
                optionGroupChildren="items"
                filter
              />
            </div>
            <div style={{ width: "100%" }}>
              <label className={styles.labeltext}>Label</label>
              <MultiSelect
                value={formData.Legal}
                options={options?.CSP_Legal || []}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    Legal: e.value,
                  }));
                }}
                optionLabel="label"
                display="chip"
                placeholder="Select Legal"
                optionGroupLabel="label"
                optionGroupChildren="items"
                filter
              />
            </div>
          </div>
        </Dialog>
      </div>
    );
  }
);

export default FolderTreeView;
