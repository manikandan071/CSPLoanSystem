/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { FolderUp, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { sp } from "@pnp/sp/presets/all";

import styles from "./FolderUploadModal.module.scss";

import FolderTreeNode from "./FolderTreeNode";

import ModalOverlay from "../ModalOverlay/ModalOverlay";
import ModalHeader from "../ModalHeader/ModalHeader";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import { setloansDetails } from "../../../../../../redux/features/LoanDeatilsSlice";
import { IUserDetails, RootState } from "../../../../../../interfaces/common";
import {
  FolderNode,
  FolderUploadModalProps,
  ILoanTree,
  UploadedFileEntry,
} from "../../../../../../interfaces/loandocument";
import {
  buildFolderTree,
  countFiles,
  patchFileStatus,
  patchFolderStatus,
  removeFileFromTree,
  toggleFolderExpanded,
} from "../../../../../../utils/UploadFoldersUtils";
import {
  buildUpdatedTree,
  uploadFolderNodeToLoan,
} from "../../../../../../services/CSPServices/UploadFolderService";
import { LIBRARIES } from "../../../../../../constants/constants";

const FolderUploadModal: React.FC<FolderUploadModalProps> = ({
  onClose,
  currentPath,
  currentSponsor,
  allSponsorLoans = [],
}) => {
  const loansDetails: ILoanTree[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.loansDetails,
  );
  const currentUserDetails: IUserDetails = useSelector(
    (state: RootState) => state.CommonDetailsContext.currentUserDetails,
  );
  const dispatch = useDispatch();

  const [folderNodes, setFolderNodes] = useState<FolderNode[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [broadcastToSponsor, setBroadcastToSponsor] = useState(false);
  const folderInputRef = useRef<HTMLInputElement>(null);

  console.log("folderNodes", folderNodes);

  const accent = "#f59e0b";

  // ── Derived ──
  const sponsorLoans = allSponsorLoans.filter(
    (l) => l.sponsor === currentSponsor,
  );
  const hasSponsorLoans = sponsorLoans.length > 1;
  const pathParts = currentPath.split("/").filter(Boolean);
  const primaryLoanNumber = pathParts[0];
  const baseFolderPath = pathParts.slice(1).join("/");
  const totalFileCount = countFiles(folderNodes);

  // ── State updaters (passed down to upload logic) ──
  const updateFileStatus = (fileId: string, update: any) =>
    setFolderNodes((prev) => patchFileStatus(prev, fileId, update));

  const updateFolderStatus = (folderId: string, update: any) =>
    setFolderNodes((prev) => patchFolderStatus(prev, folderId, update));

  // ── Handlers ──
  const addFolders = useCallback((raw: FileList | null) => {
    if (!raw) return;
    setFolderNodes((prev) => [...prev, ...buildFolderTree(raw)]);
  }, []);

  const handleRemoveFile = (folderId: string, fileId: string) =>
    setFolderNodes((prev) => removeFileFromTree(prev, folderId, fileId));

  const handleRemoveFolder = (folderId: string) =>
    setFolderNodes((prev) => prev.filter((n) => n.id !== folderId));

  const handleToggle = (folderId: string) =>
    setFolderNodes((prev) => toggleFolderExpanded(prev, folderId));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFolders(e.dataTransfer.files);
  };

  // ── Main upload ──
  const handleUpload = async () => {
    if (!folderNodes.length) return;
    setUploading(true);

    const sponsorName = currentSponsor || "";

    const webInfo = await sp.web.select("Url", "ServerRelativeUrl")();
    const siteUrl = webInfo.Url;
    const serverRelativeUrl = webInfo.ServerRelativeUrl.replace(/\/$/, "");

    const targetLoans =
      broadcastToSponsor && hasSponsorLoans
        ? sponsorLoans.map((l) => l.loanNumber)
        : [primaryLoanNumber];

    const uploadedEntries: Record<string, UploadedFileEntry[]> = {};

    for (let loanIndex = 0; loanIndex < targetLoans.length; loanIndex++) {
      const loanNumber = targetLoans[loanIndex];
      const isPrimaryLoan = loanIndex === 0;

      const loanBasePath = baseFolderPath
        ? `${serverRelativeUrl}/${LIBRARIES.LOAN_INTERNAL_NAME}/${loanNumber}/${baseFolderPath}`
        : `${serverRelativeUrl}/${LIBRARIES.LOAN_INTERNAL_NAME}/${loanNumber}`;

      const primaryLoanBasePath = baseFolderPath
        ? `/${LIBRARIES.LOAN_INTERNAL_NAME}/${primaryLoanNumber}/${baseFolderPath}`
        : `/${LIBRARIES.LOAN_INTERNAL_NAME}/${primaryLoanNumber}`;

      for (let fi = 0; fi < folderNodes.length; fi++) {
        await uploadFolderNodeToLoan({
          node: folderNodes[fi],
          loanNumber,
          parentServerRelativePath: loanBasePath,
          siteUrl,
          isPrimaryLoan,
          primaryLoanServerPath: primaryLoanBasePath,
          sponsorName,
          parentTreePath: baseFolderPath,
          uploadedEntries,
          currentUserDetails,
          updateFileStatus,
          updateFolderStatus,
        });
      }
    }

    // ── Update Redux ──
    const updatedTree = buildUpdatedTree(
      loansDetails,
      uploadedEntries,
      baseFolderPath,
    );
    dispatch(setloansDetails(updatedTree));

    setDone(true);
    setTimeout(onClose, 1400);
  };

  // ─── Success state ────────────────────────────────────────────────────────
  if (done) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalHeader
          icon={<FolderUp size={20} />}
          title="Upload Folder"
          onClose={onClose}
          accent={accent}
        />
        <div className={styles.success_state}>
          <CheckCircle2 size={48} className={styles.success_icon} />
          <p>{folderNodes.length} folder(s) uploaded!</p>
          {broadcastToSponsor && hasSponsorLoans ? (
            <p className={styles.success_sub}>
              Uploaded to {sponsorLoans.length} loans for{" "}
              <strong>{currentSponsor}</strong>
            </p>
          ) : (
            <p className={styles.success_sub}>Uploaded to current loan only</p>
          )}
        </div>
      </ModalOverlay>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────
  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        icon={<FolderUp size={20} />}
        title="Upload Folder"
        subtitle="Upload folders with their structure preserved"
        onClose={onClose}
        accent={accent}
      />

      <div className={styles.modal_body}>
        <PathBreadcrumb path={currentPath} />

        {/* ── Sponsor broadcast toggle ── */}
        {hasSponsorLoans && currentSponsor && (
          <label
            className={`${styles.broadcast_toggle} ${
              broadcastToSponsor ? styles.broadcast_toggle_active : ""
            }`}
          >
            <span
              className={`${styles.checkbox} ${broadcastToSponsor ? styles.checkbox_checked : ""}`}
              role="checkbox"
              aria-checked={broadcastToSponsor}
            >
              {broadcastToSponsor && (
                <CheckCircle2 size={11} className={styles.checkbox_icon} />
              )}
            </span>
            <input
              type="checkbox"
              className={styles.checkbox_input}
              checked={broadcastToSponsor}
              onChange={(e) => setBroadcastToSponsor(e.target.checked)}
              disabled={uploading}
            />
            <Building2 size={14} className={styles.broadcast_icon} />
            <span className={styles.broadcast_text}>
              Upload to all <strong>{currentSponsor}</strong> loans{" "}
              <span className={styles.broadcast_count}>
                ({sponsorLoans.length} loans)
              </span>
            </span>
            {broadcastToSponsor ? (
              <span className={styles.dest_pill_active}>
                {sponsorLoans.length} destinations
              </span>
            ) : (
              <span className={styles.dest_pill}>Current loan only</span>
            )}
          </label>
        )}

        {/* ── Drop zone ── */}
        <div
          className={[
            styles.dropzone,
            isDragging ? styles.dropzone_active : "",
            folderNodes.length > 0 ? styles.dropzone_compact : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => folderInputRef.current?.click()}
        >
          <input
            ref={folderInputRef}
            type="file"
            {...({ webkitdirectory: "true", multiple: true } as any)}
            style={{ display: "none" }}
            onChange={(e) => addFolders(e.target.files)}
          />
          <FolderUp size={36} className={styles.drop_icon} />
          <p className={styles.drop_title}>
            {isDragging ? "Drop here!" : "Click to select folder(s)"}
          </p>
          <p className={styles.drop_hint}>Folder structure will be preserved</p>
        </div>

        {/* ── Folder tree ── */}
        {folderNodes.length > 0 && (
          <div className={styles.folder_tree}>
            {folderNodes.map((node) => (
              <FolderTreeNode
                key={node.id}
                node={node}
                depth={0}
                onRemoveFile={handleRemoveFile}
                onRemoveFolder={handleRemoveFolder}
                onToggle={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className={styles.modal_footer}>
        <span className={styles.footer_count}>
          {folderNodes.length > 0
            ? `${folderNodes.length} folder(s) · ${totalFileCount} file(s)`
            : "No folders selected"}
        </span>
        <button
          className={styles.btn_cancel}
          onClick={onClose}
          disabled={uploading}
        >
          Cancel
        </button>
        <button
          className={styles.btn_submit}
          disabled={!folderNodes.length || uploading}
          onClick={handleUpload}
          style={{ "--accent": accent } as React.CSSProperties}
        >
          {uploading ? (
            <Loader2 size={14} className={styles.spin} />
          ) : (
            <FolderUp size={14} />
          )}
          Upload
          {broadcastToSponsor && hasSponsorLoans && (
            <span className={styles.btn_count}>×{sponsorLoans.length}</span>
          )}
        </button>
      </div>
    </ModalOverlay>
  );
};

export default FolderUploadModal;
