/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState, useRef, useCallback } from "react";
import {
  Upload,
  FolderUp,
  Building2,
  CloudUpload,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import styles from "./UploadModal.module.scss";
import {
  ILoanTree,
  SponsorLoan,
  UploadFile,
} from "../../../../../../interfaces/loandocument";
import { formatBytes, generateId } from "../../../../../../utils/CommonUtils";
import ModalOverlay from "../ModalOverlay/ModalOverlay";
import ModalHeader from "../ModalHeader/ModalHeader";
import PathBreadcrumb from "../PathBreadcrumb/PathBreadcrumb";
import ProgressBar from "../ProgressBar/ProgressBar";
import { setloansDetails } from "../../../../../../redux/features/LoanDeatilsSlice";
import {
  buildFileNode,
  insertFilesIntoTree,
} from "../../../../../../utils/UploadFilesutils";
import {
  createShortcutInLoan,
  uploadFileToSharePoint,
} from "../../../../../../services/CSPServices/UploadFilesServices";
import { IUserDetails, RootState } from "../../../../../../interfaces/common";
import { useDispatch, useSelector } from "react-redux";
import { LIBRARIES } from "../../../../../../constants/constants";

interface UploadModalProps {
  mode: "files" | "folder";
  onClose: () => void;
  currentPath: string;
  currentSponsor?: string;
  allSponsorLoans?: SponsorLoan[];
}

const UploadModal: React.FC<UploadModalProps> = ({
  mode,
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
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [broadcastToSponsor, setBroadcastToSponsor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFolder = mode === "folder";
  const accent = isFolder ? "#f59e0b" : "#3b82f6";

  // All loans belonging to the current sponsor
  const sponsorLoans = allSponsorLoans.filter(
    (l) => l.sponsor === currentSponsor,
  );
  const hasSponsorLoans = sponsorLoans.length > 1;

  // targetPaths: broadcast to all sponsor loans when checkbox is on, else current path only
  // const targetPaths =
  //   broadcastToSponsor && hasSponsorLoans
  //     ? sponsorLoans.map((l) => `${l.basePath}/${currentPath}`)
  //     : [currentPath];

  const addFiles = useCallback((raw: FileList | null) => {
    if (!raw) return;
    const newFiles: UploadFile[] = Array.from(raw).map((f) => ({
      file: f,
      id: generateId(),
      progress: 0,
      status: "pending",
    }));
    setUploadFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = (id: string) =>
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  // UploadModal.tsx — replace handleUpload
  const handleUpload = async () => {
    if (!uploadFiles.length) return;
    setUploading(true);

    const pathParts = currentPath.split("/").filter(Boolean);
    const primaryLoanNumber = pathParts[0];
    const folderPath = pathParts.slice(1).join("/");

    const targetLoans =
      broadcastToSponsor && hasSponsorLoans
        ? sponsorLoans.map((l) => l.loanNumber)
        : [primaryLoanNumber];

    const updatedFileNodes: Record<string, ILoanTree[]> = {};

    for (let fileIndex = 0; fileIndex < uploadFiles.length; fileIndex++) {
      const uf = uploadFiles[fileIndex];

      setUploadFiles((prev) =>
        prev.map((f) => (f.id === uf.id ? { ...f, status: "uploading" } : f)),
      );

      try {
        for (let loanIndex = 0; loanIndex < targetLoans.length; loanIndex++) {
          const loanNumber = targetLoans[loanIndex];
          const isFirstLoan = loanIndex === 0;

          let result: { Id: number; Path: string };

          if (isFirstLoan) {
            result = await uploadFileToSharePoint(
              LIBRARIES.LOAN_INTERNAL_NAME,
              loanNumber,
              folderPath,
              currentSponsor || "",
              uf.file,
            );

            if (!updatedFileNodes[loanNumber])
              updatedFileNodes[loanNumber] = [];
            updatedFileNodes[loanNumber].push(
              buildFileNode(
                uf.file.name,
                result.Id,
                result.Path,
                currentSponsor || "",
                currentUserDetails || { Id: 0, Title: "", Email: "" },
                false,
              ),
            );
          } else {
            result = await createShortcutInLoan(
              LIBRARIES.LOAN_INTERNAL_NAME,
              primaryLoanNumber,
              folderPath,
              uf.file.name,
              currentSponsor || "",
              loanNumber,
            );

            if (!updatedFileNodes[loanNumber])
              updatedFileNodes[loanNumber] = [];
            updatedFileNodes[loanNumber].push(
              buildFileNode(
                uf.file.name,
                result.Id,
                result.Path,
                currentSponsor || "",
                currentUserDetails || { Id: 0, Title: "", Email: "" },
                true,
              ),
            );
          }
        }

        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id ? { ...f, status: "done", progress: 100 } : f,
          ),
        );
      } catch (err: any) {
        setUploadFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id
              ? {
                  ...f,
                  status: "error",
                  error: err?.message || "Upload failed",
                }
              : f,
          ),
        );
      }
    }

    // ── Update Redux tree ──
    let updatedTree = [...loansDetails];
    for (const loanNumber of Object.keys(updatedFileNodes)) {
      // ✅ no .entries()
      updatedTree = insertFilesIntoTree(
        updatedTree,
        loanNumber,
        folderPath,
        updatedFileNodes[loanNumber],
      );
    }

    dispatch(setloansDetails(updatedTree));
    setDone(true);
    setTimeout(onClose, 1400);
  };

  // ─── Success ──────────────────────────────────────────────────────────────
  if (done) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalHeader
          icon={isFolder ? <FolderUp size={20} /> : <Upload size={20} />}
          title={isFolder ? "Upload Folder" : "Upload Files"}
          onClose={onClose}
          accent={accent}
        />
        <div className={styles.success_state}>
          <CheckCircle2 size={48} className={styles.success_icon} />
          <p>
            {uploadFiles.length} {isFolder ? "folder(s)" : "file(s)"} uploaded!
          </p>
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
        icon={isFolder ? <FolderUp size={20} /> : <Upload size={20} />}
        title={isFolder ? "Upload Folder" : "Upload Files"}
        subtitle={
          isFolder
            ? "Upload an entire folder to the current location"
            : "Upload one or more files to the current location"
        }
        onClose={onClose}
        accent={accent}
      />

      <div className={styles.modal_body}>
        <PathBreadcrumb path={currentPath} />

        {/* ── Sponsor broadcast toggle — only shown when sponsor has multiple loans ── */}
        {hasSponsorLoans && currentSponsor && (
          <label
            className={`${styles.broadcast_toggle} ${
              broadcastToSponsor ? styles.broadcast_toggle_active : ""
            }`}
          >
            {/* Custom checkbox */}
            <span
              className={`${styles.checkbox} ${
                broadcastToSponsor ? styles.checkbox_checked : ""
              }`}
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

            {/* Live destination indicator */}
            {broadcastToSponsor ? (
              <span className={styles.dest_pill_active}>
                {sponsorLoans.length} destinations
              </span>
            ) : (
              <span className={styles.dest_pill}>Current loan only</span>
            )}
          </label>
        )}

        {/* Drop zone */}
        <div
          className={[
            styles.dropzone,
            isDragging ? styles.dropzone_active : "",
            uploadFiles.length > 0 ? styles.dropzone_compact : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={!isFolder}
            {...(isFolder ? ({ webkitdirectory: "true" } as any) : {})}
            style={{ display: "none" }}
            onChange={(e) => addFiles(e.target.files)}
          />
          <CloudUpload size={36} className={styles.drop_icon} />
          <p className={styles.drop_title}>
            {isDragging
              ? "Drop here!"
              : isFolder
                ? "Click or drop a folder"
                : "Click or drop files"}
          </p>
          <p className={styles.drop_hint}>
            {isFolder
              ? "Entire folder structure will be preserved"
              : "Any file type accepted"}
          </p>
        </div>

        {/* File list */}
        {uploadFiles.length > 0 && (
          <div className={styles.file_list}>
            {uploadFiles.map((uf) => (
              <div key={uf.id} className={styles.file_item}>
                <File size={14} className={styles.file_icon} />
                <div className={styles.file_info}>
                  <span className={styles.file_name}>{uf.file.name}</span>
                  <span className={styles.file_size}>
                    {formatBytes(uf.file.size)}
                  </span>
                  {uf.status !== "pending" && (
                    <ProgressBar value={uf.progress} status={uf.status} />
                  )}
                </div>
                <div className={styles.file_status}>
                  {uf.status === "done" && (
                    <CheckCircle2 size={16} className={styles.done_icon} />
                  )}
                  {uf.status === "error" && (
                    <AlertCircle size={16} className={styles.error_icon} />
                  )}
                  {uf.status === "uploading" && (
                    <Loader2 size={16} className={styles.spin} />
                  )}
                  {uf.status === "pending" && !uploading && (
                    <button
                      className={styles.remove_btn}
                      onClick={() => removeFile(uf.id)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.modal_footer}>
        <span className={styles.footer_count}>
          {uploadFiles.length > 0
            ? `${uploadFiles.length} file(s) selected`
            : "No files selected"}
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
          disabled={!uploadFiles.length || uploading}
          onClick={handleUpload}
          style={{ "--accent": accent } as React.CSSProperties}
        >
          {uploading ? (
            <Loader2 size={14} className={styles.spin} />
          ) : isFolder ? (
            <FolderUp size={14} />
          ) : (
            <Upload size={14} />
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

export default UploadModal;
