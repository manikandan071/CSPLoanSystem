import * as React from "react";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  File,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { formatBytes } from "../../../../../../utils/CommonUtils";
import ProgressBar from "../ProgressBar/ProgressBar";
import styles from "./FolderUploadModal.module.scss";
import { FolderTreeNodeProps } from "../../../../../../interfaces/loandocument";
import { countFiles } from "../../../../../../utils/UploadFoldersUtils";

const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  node,
  depth = 0,
  onRemoveFile,
  onRemoveFolder,
  onToggle,
}) => {
  const statusClassMap: Record<typeof node.status, string> = {
    uploading: styles.status_uploading,
    pending: "",
    done: styles.status_done,
    error: styles.status_error,
  };

  const totalFiles =
    node.files.length +
    node.subFolders.reduce((a, s) => a + countFiles([s]), 0);

  return (
    <div className={styles.tree_node} style={{ marginLeft: depth * 16 }}>
      {/* ── Folder row ── */}
      <div className={`${styles.folder_row} ${statusClassMap[node.status]}`}>
        <button
          className={styles.toggle_btn}
          onClick={() => onToggle(node.id)}
          title={node.expanded ? "Collapse" : "Expand"}
        >
          {node.expanded ? (
            <ChevronDown size={12} />
          ) : (
            <ChevronRight size={12} />
          )}
        </button>

        {node.expanded ? (
          <FolderOpen size={14} className={styles.folder_icon_open} />
        ) : (
          <Folder size={14} className={styles.folder_icon} />
        )}

        <span className={styles.folder_name}>{node.name}</span>
        <span className={styles.folder_count}>
          {totalFiles} file{totalFiles !== 1 ? "s" : ""}
        </span>

        {node.status === "uploading" && (
          <Loader2 size={13} className={styles.spin} />
        )}
        {node.status === "done" && (
          <CheckCircle2 size={13} className={styles.done_icon} />
        )}
        {node.status === "error" && (
          <AlertCircle size={13} className={styles.error_icon} />
        )}
        {node.status === "pending" && (
          <button
            className={styles.remove_btn}
            onClick={() => onRemoveFolder(node.id)}
            title="Remove folder"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* ── Children ── */}
      {node.expanded && (
        <div className={styles.tree_children}>
          {node.subFolders.map((sub) => (
            <FolderTreeNode
              key={sub.id}
              node={sub}
              depth={depth + 1}
              onRemoveFile={onRemoveFile}
              onRemoveFolder={onRemoveFolder}
              onToggle={onToggle}
            />
          ))}

          {node.files.map((f) => (
            <div
              key={f.id}
              className={`${styles.file_row} ${statusClassMap[f.status]}`}
              style={{ marginLeft: 16 }}
            >
              <File size={12} className={styles.file_icon} />
              <div className={styles.file_info}>
                <span className={styles.file_name}>{f.file.name}</span>
                <span className={styles.file_size}>
                  {formatBytes(f.file.size)}
                </span>
                {f.status !== "pending" && (
                  <ProgressBar value={f.progress} status={f.status} />
                )}
                {f.error && (
                  <span className={styles.file_error}>{f.error}</span>
                )}
              </div>
              <div className={styles.file_actions}>
                {f.status === "done" && (
                  <CheckCircle2 size={13} className={styles.done_icon} />
                )}
                {f.status === "error" && (
                  <AlertCircle size={13} className={styles.error_icon} />
                )}
                {f.status === "uploading" && (
                  <Loader2 size={13} className={styles.spin} />
                )}
                {f.status === "pending" && (
                  <button
                    className={styles.remove_btn}
                    onClick={() => onRemoveFile(node.id, f.id)}
                    title="Remove file"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderTreeNode;
