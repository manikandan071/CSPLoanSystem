import * as React from "react";
import { X } from "lucide-react";
import styles from "./ModalHeader.module.scss";

interface ModalHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose: () => void;
  accent?: string;
}

const ModalHeader: React.FC<ModalHeaderProps> = ({
  icon,
  title,
  subtitle,
  onClose,
  accent = "#3b82f6",
}) => (
  <div className={styles.modal_header}>
    <div
      className={styles.header_icon}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      {icon}
    </div>

    <div className={styles.header_text}>
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>

    <button className={styles.close_btn} onClick={onClose} aria-label="Close">
      <X size={16} />
    </button>
  </div>
);

export default ModalHeader;
