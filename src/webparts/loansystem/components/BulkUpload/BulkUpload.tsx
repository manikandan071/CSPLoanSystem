/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { useSelector } from "react-redux";
import styles from "./BulkUpload.module.scss";
import {
  CloudUploadOutlined,
  FilePdfOutlined,
  FileOutlined,
  CloseCircleOutlined,
  BankOutlined,
  TeamOutlined,
  GlobalOutlined,
  UserOutlined,
  CheckOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { Select } from "antd";
import FolderTreeSelect from "./Foldertreeselect/Foldertreeselect";
import UploadProgressOverlay from "./Uploadprogressoverlay/Uploadprogressoverlay";
import {
  parseFileName,
  uploadFileToSharePoint,
  createShortcutInLoan,
  FileUploadItem,
  UploadMode,
} from "../../../../utils/Bulkuploadutils";
import { LIBRARIES } from "../../../../constants/constants";
import { RootState } from "../../../../interfaces/common";
import { ILoanTree, ISponsor } from "../../../../interfaces/loandocument";

const MAX_FILES = 80;

interface BulkUploadProps {
  onClose?: () => void;
}

const UploadModeConfig: {
  key: UploadMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    key: "single",
    label: "Single Loan",
    desc: "Upload to one loan",
    icon: <BankOutlined />,
  },
  {
    key: "multi-loan",
    label: "Multi Loan",
    desc: "Upload + shortcuts",
    icon: <TeamOutlined />,
  },
  {
    key: "sponsor",
    label: "By Sponsor",
    desc: "All sponsor loans",
    icon: <UserOutlined />,
  },
  {
    key: "all",
    label: "All Loans",
    desc: "Broadcast to all",
    icon: <GlobalOutlined />,
  },
];

const BulkUpload: React.FC<BulkUploadProps> = ({ onClose }) => {
  const loansDetails: ILoanTree[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.loansDetails,
  );
  const sponsorDetails: ISponsor[] =
    useSelector((s: any) => s.LoanDetailsContext.sponsorDetails) || [];

  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadItems, setUploadItems] = useState<FileUploadItem[]>([]);

  const dropRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loanOptions = loansDetails.map((l: any) => ({
    label: l.name,
    value: l.name,
  }));
  const sponsorOptions = sponsorDetails.map((s: any) => ({
    label: s.Title || s.name,
    value: s.Title || s.name,
  }));

  // ── Count loans under a sponsor ────────────────────────
  const getSponsorLoanCount = (sponsor: string | null): number => {
    if (!sponsor) return 0;
    return loansDetails.filter((l) => l.Sponsor === sponsor).length;
  };

  // ── File processing ────────────────────────────────────
  const processFiles = useCallback(
    (rawFiles: File[]) => {
      const remaining = MAX_FILES - files.length;
      const toAdd = rawFiles.slice(0, remaining);
      const newItems: FileUploadItem[] = toAdd.map((f) => {
        const parsed = parseFileName(f.name);
        return {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file: f,
          loanNumber: parsed.loanNumber,
          folderPath: parsed.folderPath,
          status: "pending",
          progress: 0,
          uploadMode: "single",
          selectedLoan: parsed.loanNumber,
          selectedLoans: [],
          selectedSponsor: null,
        };
      });
      setFiles((prev) => [...prev, ...newItems]);
    },
    [files.length],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      processFiles(Array.from(e.dataTransfer.files));
    },
    [processFiles],
  );

  const removeFile = (id: string) =>
    setFiles((p) => p.filter((f) => f.id !== id));

  const updateFile = (id: string, updates: Partial<FileUploadItem>) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  // ── Upload ─────────────────────────────────────────────
  const handleUpload = async () => {
    if (files.length === 0) return;
    const itemsToUpload: FileUploadItem[] = [];

    for (const f of files) {
      if (f.uploadMode === "single") {
        itemsToUpload.push({ ...f, loanNumber: f.selectedLoan });
      } else if (f.uploadMode === "multi-loan") {
        f.selectedLoans.forEach((loan) => {
          itemsToUpload.push({ ...f, id: `${f.id}-${loan}`, loanNumber: loan });
        });
      } else if (f.uploadMode === "sponsor") {
        loansDetails
          .filter((l) => l.Sponsor === f.selectedSponsor)
          .forEach((loan: any) => {
            itemsToUpload.push({
              ...f,
              id: `${f.id}-${loan.name}`,
              loanNumber: loan.name,
            });
          });
      } else if (f.uploadMode === "all") {
        loansDetails.forEach((loan: any) => {
          itemsToUpload.push({
            ...f,
            id: `${f.id}-${loan.name}`,
            loanNumber: loan.name,
          });
        });
      }
    }

    setUploadItems(
      itemsToUpload.map((i) => ({ ...i, status: "uploading", progress: 0 })),
    );
    setUploading(true);

    for (const item of itemsToUpload) {
      try {
        for (let p = 10; p <= 80; p += 20) {
          await new Promise<void>((resolve) => setTimeout(resolve, 100));
          setUploadItems((prev) =>
            prev.map((x) => (x.id === item.id ? { ...x, progress: p } : x)),
          );
        }

        if (item.loanNumber && item.folderPath) {
          const originalFile = files.find((f) => item.id.startsWith(f.id));
          const isFirstLoan =
            originalFile?.uploadMode === "multi-loan"
              ? originalFile.selectedLoans[0] === item.loanNumber
              : true;

          if (originalFile?.uploadMode === "multi-loan" && !isFirstLoan) {
            const primaryLoan = originalFile.selectedLoans[0];
            await createShortcutInLoan(
              LIBRARIES.LOAN_INTERNAL_NAME,
              primaryLoan,
              item.folderPath,
              item.file.name,
              item.loanNumber,
            );
          } else {
            await uploadFileToSharePoint(
              LIBRARIES.LOAN_INTERNAL_NAME,
              item.loanNumber,
              item.folderPath,
              item.file,
            );
          }
        }

        setUploadItems((prev) =>
          prev.map((x) =>
            x.id === item.id ? { ...x, status: "success", progress: 100 } : x,
          ),
        );
      } catch (err: any) {
        setUploadItems((prev) =>
          prev.map((x) =>
            x.id === item.id
              ? {
                  ...x,
                  status: "error",
                  error: err?.message || "Upload failed",
                }
              : x,
          ),
        );
      }
    }
  };

  const handleOverlayClose = () => {
    setUploading(false);
    setUploadItems([]);
    setFiles([]);
    onClose?.();
  };

  const getFileIcon = (name: string) => {
    if (name.toLowerCase().endsWith(".pdf"))
      return <FilePdfOutlined className={styles.icon_pdf} />;
    return <FileOutlined className={styles.icon_file} />;
  };

  const canSubmit = () => {
    if (files.length === 0) return false;
    return files.every((f) => {
      if (!f.folderPath) return false;
      if (f.uploadMode === "single" && !f.selectedLoan) return false;
      if (f.uploadMode === "multi-loan" && f.selectedLoans.length === 0)
        return false;
      if (f.uploadMode === "sponsor" && !f.selectedSponsor) return false;
      return true;
    });
  };

  return (
    <div className={styles.wrapper}>
      {uploading && (
        <UploadProgressOverlay
          items={uploadItems}
          onClose={handleOverlayClose}
        />
      )}

      <div className={styles.bulk_upload_section}>
        {/* ── Drop Zone ── */}
        <div>
          <h4 className={styles.section_label}>
            Files
            <span className={styles.file_count}>
              {files.length}/{MAX_FILES}
            </span>
          </h4>
          <div
            ref={dropRef}
            className={`${styles.drop_zone} ${isDragging ? styles.dragging : ""}`}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => processFiles(Array.from(e.target.files || []))}
            />
            <div className={styles.drop_content}>
              <div
                className={`${styles.drop_icon_wrap} ${isDragging ? styles.bounce : ""}`}
              >
                <CloudUploadOutlined className={styles.drop_icon} />
              </div>
              <p className={styles.drop_title}>
                {isDragging ? "Release to add files" : "Drag & drop files here"}
              </p>
              <p className={styles.drop_sub}>
                or click to browse — up to {MAX_FILES} files
              </p>
              <p className={styles.drop_hint}>
                Name files as{" "}
                <code>LoanNumber_Section_SubSection_filename.pdf</code> for
                auto-detection
              </p>
            </div>
          </div>
        </div>
        {/* ── File Cards ── */}
        {files.length > 0 && (
          <div className={styles.files_grid}>
            {files.map((item, idx) => (
              <div
                key={item.id}
                className={styles.file_card}
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                {/* Card Header */}
                <div className={styles.file_card_header}>
                  <div className={styles.file_icon_wrap}>
                    {getFileIcon(item.file.name)}
                  </div>
                  <div className={styles.file_header_info}>
                    <span className={styles.file_name} title={item.file.name}>
                      {item.file.name}
                    </span>
                    <span className={styles.file_size}>
                      {(item.file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    className={styles.remove_btn}
                    onClick={() => removeFile(item.id)}
                  >
                    <CloseCircleOutlined />
                  </button>
                </div>

                {/* Card Body */}
                <div className={styles.file_card_body}>
                  {/* Upload Mode */}
                  <div className={styles.mini_field}>
                    <label className={styles.field_label}>Upload Mode</label>
                    <div className={styles.mini_mode_row}>
                      {UploadModeConfig.map((m) => (
                        <button
                          key={m.key}
                          className={`${styles.mini_mode_btn} ${item.uploadMode === m.key ? styles.mini_mode_active : ""}`}
                          onClick={() =>
                            updateFile(item.id, {
                              uploadMode: m.key,
                              selectedLoan: null,
                              selectedLoans: [],
                              selectedSponsor: null,
                            })
                          }
                          title={m.desc}
                        >
                          <span className={styles.mini_mode_icon}>
                            {m.icon}
                          </span>
                          <span>{m.label}</span>
                          {item.uploadMode === m.key && (
                            <CheckOutlined className={styles.mini_mode_check} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Single Loan */}
                  {item.uploadMode === "single" && (
                    <div className={styles.mini_field}>
                      <label className={styles.field_label}>Loan Number</label>
                      <Select
                        showSearch
                        size="small"
                        placeholder="Select loan…"
                        options={loanOptions}
                        value={item.selectedLoan}
                        onChange={(v) =>
                          updateFile(item.id, {
                            selectedLoan: v,
                            loanNumber: v,
                          })
                        }
                        style={{ width: "100%" }}
                        filterOption={(input, opt) =>
                          (opt?.label as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        getPopupContainer={(trigger) =>
                          trigger.parentElement || document.body
                        }
                      />
                    </div>
                  )}

                  {/* Multi Loan */}
                  {item.uploadMode === "multi-loan" && (
                    <div className={styles.mini_field}>
                      <label className={styles.field_label}>Loan Numbers</label>
                      <Select
                        mode="multiple"
                        size="small"
                        placeholder="Select loans…"
                        options={loanOptions}
                        value={item.selectedLoans}
                        onChange={(v) =>
                          updateFile(item.id, { selectedLoans: v })
                        }
                        style={{ width: "100%" }}
                        filterOption={(input, opt) =>
                          (opt?.label as string)
                            ?.toLowerCase()
                            .includes(input.toLowerCase())
                        }
                        maxTagCount={2}
                        getPopupContainer={(trigger) =>
                          trigger.parentElement || document.body
                        }
                      />
                      {item.selectedLoans.length > 0 && (
                        <div className={styles.info_banner}>
                          <InfoCircleOutlined />
                          <span>
                            <strong>{item.selectedLoans[0]}</strong> gets the
                            real upload.{" "}
                            {item.selectedLoans.length - 1 > 0 && (
                              <>
                                {item.selectedLoans.length - 1} other
                                {item.selectedLoans.length - 1 > 1
                                  ? "s"
                                  : ""}{" "}
                                get shortcuts.
                              </>
                            )}
                          </span>
                        </div>
                      )}
                      {item.selectedLoans.length === 0 && (
                        <p className={styles.hint}>
                          First loan has the original uploaded file, Others
                          loans only have shortcuts.
                        </p>
                      )}
                    </div>
                  )}

                  {/* By Sponsor */}
                  {item.uploadMode === "sponsor" && (
                    <div className={styles.mini_field}>
                      <label className={styles.field_label}>Sponsor</label>
                      <Select
                        showSearch
                        size="small"
                        placeholder="Select sponsor…"
                        options={sponsorOptions}
                        value={item.selectedSponsor}
                        onChange={(v) =>
                          updateFile(item.id, { selectedSponsor: v })
                        }
                        style={{ width: "100%" }}
                        getPopupContainer={(trigger) =>
                          trigger.parentElement || document.body
                        }
                      />
                      {item.selectedSponsor && (
                        <div className={styles.sponsor_info_banner}>
                          <InfoCircleOutlined />
                          <span>
                            This file will be uploaded to{" "}
                            <strong>
                              {getSponsorLoanCount(item.selectedSponsor)} loan
                              {getSponsorLoanCount(item.selectedSponsor) !== 1
                                ? "s"
                                : ""}
                            </strong>{" "}
                            under <strong>{item.selectedSponsor}</strong>.
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* All Loans */}
                  {item.uploadMode === "all" && (
                    <div className={styles.all_warning}>
                      <InfoCircleOutlined />
                      <div>
                        {/* <p className={styles.warning_title}>Broadcast Upload</p> */}
                        <p className={styles.warning_desc}>
                          Uploads to all <strong>{loansDetails.length}</strong>{" "}
                          loans.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Folder Path — ✅ overflow visible, dropdown not clipped */}
                  <div className={styles.mini_field}>
                    <label className={styles.field_label}>
                      Folder Path
                      {item.folderPath && (
                        <span className={styles.auto_badge}>auto-detected</span>
                      )}
                    </label>
                    <FolderTreeSelect
                      value={item.folderPath}
                      onChange={(v) => updateFile(item.id, { folderPath: v })}
                      placeholder="Select folder…"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className={styles.footer}>
        <button className={styles.cancel_btn} onClick={onClose}>
          Cancel
        </button>
        <button
          className={`${styles.submit_btn} ${!canSubmit() ? styles.disabled : ""}`}
          onClick={handleUpload}
          disabled={!canSubmit()}
        >
          <CloudUploadOutlined />
          Upload
          {files.length > 0
            ? `${files.length} file${files.length > 1 ? "s" : ""}`
            : ""}
        </button>
      </div>
    </div>
  );
};

export default BulkUpload;
