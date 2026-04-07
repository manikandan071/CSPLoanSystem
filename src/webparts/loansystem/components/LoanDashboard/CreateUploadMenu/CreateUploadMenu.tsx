/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import styles from "./CreateUploadMenu.module.scss";
import { CreateUploadMenuProps } from "../../../../../interfaces/loandocument";
import { ModalType } from "../../../../../types/loan.types";
import NewLoanModal from "../Components/NewLoanModal/NewLoanModal";
import NewFolderModal from "../Components/NewFolderModal/NewFolderModal";
import UploadModal from "../Components/UploadModal/UploadModal";
import { MENU_ITEMS } from "../../../../../constants/constants";
import FolderUploadModal from "../Components/FolderUploadModal/FolderUploadModal";

const CreateUploadMenu: React.FC<CreateUploadMenuProps> = ({
  navigationStack = [],
  currentSponsor,
  allSponsorLoans = [],
}) => {
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const currentPath = navigationStack.map((n) => n.name).join("/");

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const openModal = (type: ModalType) => {
    setOpen(false);
    setActiveModal(type);
  };

  const closeModal = () => setActiveModal(null);

  return (
    <>
      {/* ── Trigger + Dropdown ── */}
      <div className={styles.menu_container} ref={menuRef}>
        <button
          className={`${styles.trigger_btn} ${open ? styles.trigger_active : ""}`}
          onClick={() => setOpen((v) => !v)}
        >
          <Plus
            size={14}
            className={`${styles.plus_icon} ${open ? styles.plus_rotated : ""}`}
          />
          Create or upload
        </button>

        {open && (
          <div className={styles.dropdown}>
            {MENU_ITEMS?.map((item) => (
              <button
                key={item.key}
                className={styles.dropdown_item}
                onClick={() => openModal(item.key)}
              >
                <span className={styles.item_icon}>{item.icon}</span>
                <span className={styles.item_content}>
                  <span className={styles.item_label}>{item.label}</span>
                  <span className={styles.item_desc}>{item.description}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {activeModal === "loan" && <NewLoanModal onClose={closeModal} />}

      {activeModal === "folder" && (
        <NewFolderModal
          onClose={closeModal}
          currentPath={currentPath}
          currentSponsor={currentSponsor}
        />
      )}

      {activeModal === "files" && (
        <UploadModal
          mode="files"
          onClose={closeModal}
          currentPath={currentPath}
          currentSponsor={currentSponsor}
          allSponsorLoans={allSponsorLoans}
        />
      )}

      {activeModal === "folderUpload" && (
        <FolderUploadModal
          onClose={closeModal}
          currentPath={currentPath}
          currentSponsor={currentSponsor}
          allSponsorLoans={allSponsorLoans}
        />
      )}
    </>
  );
};

export default CreateUploadMenu;
