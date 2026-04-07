import * as React from "react";
import { useState, useRef, useEffect } from "react";
import * as ReactDOM from "react-dom";
import { FOLDER_TREE } from "../../../../../utils/Bulkuploadutils";
import styles from "./Foldertreeselect.module.scss";
import {
  CaretRightOutlined,
  FolderOutlined,
  FolderOpenOutlined,
} from "@ant-design/icons";

interface FolderTreeSelectProps {
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface TreeNodeProps {
  node: any;
  onSelect: (value: string) => void;
  selectedValue: string | null;
  depth: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  onSelect,
  selectedValue,
  depth,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children?.length > 0;
  const isSelected = selectedValue === node.value;

  return (
    <div className={styles.tree_node}>
      <div
        className={`${styles.node_row} ${isSelected ? styles.selected : ""}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={() => {
          if (hasChildren) setExpanded((p) => !p);
          onSelect(node.value);
        }}
      >
        {hasChildren ? (
          <span
            className={`${styles.caret} ${expanded ? styles.caret_open : ""}`}
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
          >
            <CaretRightOutlined />
          </span>
        ) : (
          <span className={styles.caret_spacer} />
        )}
        <span className={styles.folder_icon}>
          {expanded ? <FolderOpenOutlined /> : <FolderOutlined />}
        </span>
        <span className={styles.node_label}>{node.label}</span>
      </div>

      {hasChildren && expanded && (
        <div className={styles.children}>
          {node.children.map((child: any) => (
            <TreeNode
              key={child.value}
              node={child}
              onSelect={onSelect}
              selectedValue={selectedValue}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FolderTreeSelect: React.FC<FolderTreeSelectProps> = ({
  value,
  onChange,
  placeholder = "Select folder path",
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── Use fixed positioning — immune to any parent scroll/overflow ──
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < dropdownHeight && rect.top > dropdownHeight) {
      // Flip upward
      setDropdownStyle({
        position: "fixed",
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        top: "auto",
      });
    } else {
      // Open downward
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
      });
    }
  };

  const handleOpen = () => {
    updatePosition();
    setOpen((p) => !p);
  };

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      const portalEl = document.getElementById("folder-tree-portal");
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(target) &&
        portalEl &&
        !portalEl.contains(target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Reposition on scroll or resize (any scroll, not just window) ──
  useEffect(() => {
    if (!open) return;
    const handler = () => updatePosition();
    window.addEventListener("scroll", handler, true); // capture phase catches nested scrolls
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
  }, [open]);

  const dropdownPortal = open
    ? ReactDOM.createPortal(
        <div
          id="folder-tree-portal"
          className={styles.dropdown_portal}
          style={dropdownStyle}
        >
          <div className={styles.tree_scroll}>
            {FOLDER_TREE.map((node) => (
              <TreeNode
                key={node.value}
                node={node}
                onSelect={(val) => {
                  onChange(val);
                  setOpen(false);
                }}
                selectedValue={value}
                depth={0}
              />
            ))}
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div
        ref={triggerRef}
        className={`${styles.trigger} ${open ? styles.trigger_open : ""} ${value ? styles.has_value : ""}`}
        onClick={handleOpen}
      >
        <FolderOutlined className={styles.trigger_icon} />
        <span
          className={`${styles.trigger_text} ${!value ? styles.placeholder : ""}`}
        >
          {value || placeholder}
        </span>
        <span className={`${styles.arrow} ${open ? styles.arrow_up : ""}`}>
          ▾
        </span>
      </div>

      {dropdownPortal}
    </div>
  );
};

export default FolderTreeSelect;
