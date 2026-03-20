import * as React from "react";
import styles from "./button.module.scss";
import { LoadingOutlined } from "@ant-design/icons";

type ButtonType = "primary" | "secondary" | "submit" | "cancel";

interface IButtonProps {
  type?: ButtonType;
  label?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  htmlType?: "button" | "submit" | "reset";
  className?: string;
  style?: React.CSSProperties;
}

const CustomButton: React.FC<IButtonProps> = ({
  type = "primary",
  label = "Button",
  onClick,
  disabled = false,
  loading = false,
  icon,
  htmlType = "button",
  className = "",
  style,
}) => {
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    onClick?.(event);
  };

  return (
    <button
      type={htmlType}
      className={`${styles.btn} ${styles[`btn_${type}`]} ${disabled || loading ? styles.btn_disabled : ""} ${className}`}
      onClick={handleClick}
      disabled={disabled || loading}
      style={style}
    >
      {loading ? (
        <LoadingOutlined className={styles.btn_icon} />
      ) : (
        icon && <span className={styles.btn_icon}>{icon}</span>
      )}
      <span>{label}</span>
    </button>
  );
};

export default CustomButton;
