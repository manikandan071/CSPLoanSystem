import * as React from "react";
import { UploadFile } from "../../../../../../interfaces/loandocument";
import styles from "./ProgressBar.module.scss";

interface ProgressBarProps {
  value: number;
  status: UploadFile["status"];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ value, status }) => (
  <div className={styles.progress_track}>
    <div
      className={`${styles.progress_fill} ${styles[`progress_${status}`]}`}
      style={{ width: `${value}%` }}
    />
  </div>
);

export default ProgressBar;
