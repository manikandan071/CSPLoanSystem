/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState } from "react";
import { FolderPlus, CheckCircle2, Loader2 } from "lucide-react";
import styles from "./NewFolderModal.module.scss";
import ModalOverlay from "../ModalOverlay/ModalOverlay";
import ModalHeader from "../ModalHeader/ModalHeader";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import { handleNewFolder } from "../../../../../../services/CSPServices/CreateNewfolderService";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../../../interfaces/common";
import { ILoanTree } from "../../../../../../interfaces/loandocument";

interface NewFolderModalProps {
  onClose: () => void;
  currentPath: string;
  currentSponsor: string | undefined;
}

const NewFolderModal: React.FC<NewFolderModalProps> = ({
  onClose,
  currentPath,
  currentSponsor,
}) => {
  const loansDetails: ILoanTree[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.loansDetails,
  );
  const dispatch = useDispatch();
  const [folderName, setFolderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const fullPath = currentPath ? `${currentPath}/${folderName}` : folderName;

  const handleSubmit = async () => {
    if (!folderName.trim()) return;
    setSubmitting(true);
    try {
      // await onSubmit?.(folderName.trim(), fullPath);
      await handleNewFolder(
        folderName.trim(),
        currentPath,
        currentSponsor ?? "",
        dispatch,
        loansDetails ?? [],
      );
    } catch (error) {
      console.error("Error creating folder:", error);
    }
    setDone(true);
    setTimeout(onClose, 1000);
  };

  if (done) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalHeader
          icon={<FolderPlus size={20} />}
          title="New Folder"
          onClose={onClose}
          accent="#10b981"
        />
        <div className={styles.success_state}>
          <CheckCircle2 size={48} className={styles.success_icon} />
          <p>
            Folder <strong>{folderName}</strong> created!
          </p>
        </div>
      </ModalOverlay>
    );
  }

  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        icon={<FolderPlus size={20} />}
        title="New Folder"
        subtitle="Add a folder at the current location"
        onClose={onClose}
        accent="#10b981"
      />

      <div className={styles.modal_body}>
        <PathBreadcrumb path={currentPath} />

        <div className={styles.field_group}>
          <label className={styles.field_label}>
            <FolderPlus size={14} /> Folder Name
          </label>
          <input
            className={styles.text_input}
            placeholder="e.g. 2024 Documents"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) =>
              e.key === "Enter" && folderName.trim() && handleSubmit()
            }
            autoFocus
          />
        </div>

        {folderName.trim() && (
          <div className={styles.path_preview}>
            <span className={styles.path_preview_label}>
              Will be created at:
            </span>
            <code>{fullPath}</code>
          </div>
        )}
      </div>

      <div className={styles.modal_footer}>
        <button className={styles.btn_cancel} onClick={onClose}>
          Cancel
        </button>
        <button
          className={styles.btn_submit}
          disabled={!folderName.trim() || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <Loader2 size={14} className={styles.spin} />
          ) : (
            <FolderPlus size={14} />
          )}
          Create Folder
        </button>
      </div>
    </ModalOverlay>
  );
};

export default NewFolderModal;
