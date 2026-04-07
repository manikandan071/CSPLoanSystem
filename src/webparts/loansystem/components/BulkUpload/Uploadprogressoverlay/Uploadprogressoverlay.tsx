import * as React from "react";
import styles from "./Uploadprogressoverlay.module.scss";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from "@ant-design/icons";

import { FileUploadItem } from "../../../../../utils/Bulkuploadutils";

interface UploadProgressOverlayProps {
  items: FileUploadItem[];
  onClose: () => void;
}

const STATUS_MESSAGES = [
  "Connecting to SharePoint…",
  "Verifying folder structure…",
  "Uploading files to library…",
  "Creating shortcuts for linked loans…",
  "Finalizing upload…",
];

const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  items,
  onClose,
}) => {
  const statusClassMap: Record<FileUploadItem["status"], string> = {
    pending: styles.status_pending,
    uploading: styles.status_uploading,
    success: styles.status_success,
    error: styles.status_error,
  };
  const [msgIndex, setMsgIndex] = React.useState(0);

  const total = items.length;
  const done = items.filter(
    (i) => i.status === "success" || i.status === "error",
  ).length;
  const errors = items.filter((i) => i.status === "error").length;
  const overallPercent = total > 0 ? Math.round((done / total) * 100) : 0;
  const isComplete = done === total;

  React.useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setMsgIndex((p) => (p + 1) % STATUS_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.header_icon}>
            {isComplete ? (
              errors === 0 ? (
                <CheckCircleOutlined className={styles.icon_success} />
              ) : (
                <CloseCircleOutlined className={styles.icon_partial} />
              )
            ) : (
              <LoadingOutlined className={styles.icon_loading} spin />
            )}
          </div>
          <div className={styles.header_text}>
            <h3>
              {isComplete
                ? errors === 0
                  ? "Upload Complete!"
                  : "Upload Finished with Errors"
                : "Uploading Files…"}
            </h3>
            <p>
              {isComplete
                ? `${done - errors} of ${total} files uploaded successfully`
                : STATUS_MESSAGES[msgIndex]}
            </p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div className={styles.overall_bar_wrapper}>
          <div className={styles.overall_bar}>
            <div
              className={`${styles.overall_bar_fill} ${isComplete && errors === 0 ? styles.fill_success : ""}`}
              style={{ width: `${overallPercent}%` }}
            />
          </div>
          <span className={styles.percent}>{overallPercent}%</span>
        </div>

        {/* File list */}
        <div className={styles.file_list}>
          {items.map((item) => (
            <div
              key={item.id}
              className={`${styles.file_row} ${statusClassMap[item.status]}`}
            >
              <div className={styles.file_info}>
                <span className={styles.file_name}>{item.file.name}</span>
                {item.loanNumber && (
                  <span className={styles.file_meta}>
                    {item.loanNumber} / {item.folderPath || "Root"}
                  </span>
                )}
              </div>
              <div className={styles.file_right}>
                {item.status === "uploading" && (
                  <div className={styles.mini_bar}>
                    <div
                      className={styles.mini_bar_fill}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                )}
                {item.status === "success" && (
                  <CheckCircleOutlined className={styles.status_icon_success} />
                )}
                {item.status === "error" && (
                  <span className={styles.error_msg}>
                    {item.error || "Failed"}
                  </span>
                )}
                {item.status === "pending" && (
                  <span className={styles.pending_dot} />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        {isComplete && (
          <div className={styles.footer}>
            <button className={styles.close_btn} onClick={onClose}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadProgressOverlay;
