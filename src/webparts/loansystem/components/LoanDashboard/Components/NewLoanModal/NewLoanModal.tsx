/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  Hash,
  UserPlus,
  Search,
  CheckCircle2,
  Loader2,
  FolderOpen,
  X,
} from "lucide-react";
import styles from "./NewLoanModal.module.scss";
import { ILoanTree, ISponsor } from "../../../../../../interfaces/loandocument";
import { buildLoanFolderStructure } from "../../../../../../constants/constants";
import ModalOverlay from "../ModalOverlay/ModalOverlay";
import ModalHeader from "../ModalHeader/ModalHeader";
import ProgressBar from "../ProgressBar/ProgressBar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../../../../../interfaces/common";
import { createLoanFolders } from "../../../../../../services/CSPServices/CreateLoanServices";

interface NewLoanModalProps {
  onClose: () => void;
}

const NewLoanModal: React.FC<NewLoanModalProps> = ({ onClose }) => {
  const loansDetails: ILoanTree[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.loansDetails,
  );
  const sponsorDetails: ISponsor[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.sponsorDetails,
  );

  const dispatch = useDispatch();

  const [loanNumber, setLoanNumber] = useState("");
  const [sponsorSearch, setSponsorSearch] = useState("");
  const [selectedSponsor, setSelectedSponsor] = useState<ISponsor | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNewSponsor, setShowNewSponsor] = useState(false);
  const [newSponsorName, setNewSponsorName] = useState("");
  const [sponsors, setSponsors] = useState<ISponsor[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [creatingFolders, setCreatingFolders] = useState(false);
  const [folderProgress, setFolderProgress] = useState(0);
  const [done, setDone] = useState(false);

  const sponsorWrapRef = useRef<HTMLDivElement>(null);

  // ─── Populate sponsors from Redux ─────────────────────────────────────────
  useEffect(() => {
    if (sponsorDetails?.length) {
      setSponsors([...sponsorDetails]);
    }
  }, [sponsorDetails]);

  // ─── Close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        sponsorWrapRef.current &&
        !sponsorWrapRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ─── Derived ──────────────────────────────────────────────────────────────
  const filteredSponsors = sponsors.filter((s) =>
    s.Title.toLowerCase().includes(sponsorSearch.toLowerCase()),
  );

  const isValid = loanNumber.trim() && selectedSponsor;
  const previewFolders = buildLoanFolderStructure(loanNumber || "LN-XXXX");

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleSponsorSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setSponsorSearch(e.target.value);
    setSelectedSponsor(null);
    setDropdownOpen(true);
  };

  const handleSponsorSelect = (s: ISponsor) => {
    setSelectedSponsor(s);
    setSponsorSearch(s.Title);
    setDropdownOpen(false);
    setShowNewSponsor(false);
  };

  const handleClearSponsor = () => {
    setSelectedSponsor(null);
    setSponsorSearch("");
    setDropdownOpen(false);
  };

  const handleAddSponsor = () => {
    if (!newSponsorName.trim()) return;
    const ns: ISponsor = {
      Id: Date.now(),
      Title: newSponsorName.trim(),
      Loans: [],
    };
    setSponsors((prev) => [...prev, ns]);
    handleSponsorSelect(ns);
    setShowNewSponsor(false);
    setNewSponsorName("");
  };

  const handleSubmit = async () => {
    if (!loanNumber.trim() || !selectedSponsor) return;
    setSubmitting(true);
    setCreatingFolders(true);

    try {
      await createLoanFolders(
        loanNumber.trim(),
        selectedSponsor.Title,
        dispatch,
        loansDetails,
        (progress) => setFolderProgress(progress), // ✅ real progress callback
      );
    } catch (error) {
      console.error("Error creating loan folders:", error);
    }

    setDone(true);
    setTimeout(onClose, 1200);
  };

  // ─── Success state ────────────────────────────────────────────────────────
  if (done) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalHeader
          icon={<Building2 size={20} />}
          title="Create New Loan"
          subtitle="Loan created successfully!"
          onClose={onClose}
          accent="#6366f1"
        />
        <div className={styles.success_state}>
          <CheckCircle2 size={48} className={styles.success_icon} />
          <p>
            Loan <strong>{loanNumber}</strong> for sponsor{" "}
            <strong>{selectedSponsor?.Title}</strong> created with{" "}
            {previewFolders.length} folders.
          </p>
        </div>
      </ModalOverlay>
    );
  }

  // ─── Creating-folders state ───────────────────────────────────────────────
  if (creatingFolders) {
    return (
      <ModalOverlay onClose={onClose}>
        <ModalHeader
          icon={<Building2 size={20} />}
          title="Create New Loan"
          subtitle="Onboarding new loan with the complete folder structure on CSP. This may take a moment."
          onClose={onClose}
          accent="#6366f1"
        />
        <div className={styles.creating_state}>
          <Loader2 size={32} className={styles.spin} />
          <p>Creating folder structure…</p>
          <div className={styles.folder_progress_wrap}>
            <ProgressBar value={folderProgress} status="uploading" />
            <span>{folderProgress}%</span>
          </div>
          <p className={styles.creating_hint}>
            {buildLoanFolderStructure(loanNumber).length} folders will be
            created for loan {loanNumber}.
          </p>
        </div>
      </ModalOverlay>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────
  return (
    <ModalOverlay onClose={onClose}>
      <ModalHeader
        icon={<Building2 size={20} />}
        title="Create New Loan"
        subtitle="Start by entering a loan number and selecting a sponsor."
        onClose={onClose}
        accent="#6366f1"
      />

      <div className={styles.modal_body}>
        {/* ── Loan number ── */}
        <div className={styles.field_group}>
          <label className={styles.field_label}>
            <Hash size={14} /> Loan Number
          </label>
          <input
            className={styles.text_input}
            placeholder="e.g. LN-2024-0042"
            value={loanNumber}
            onChange={(e) => setLoanNumber(e.target.value)}
            autoFocus
          />
        </div>

        {/* ── Sponsor picker ── */}
        <div className={styles.field_group}>
          <label className={styles.field_label}>
            <UserPlus size={14} /> Sponsor
          </label>

          {/*
            sponsorWrapRef wraps both the input and the dropdown so that
            the outside-click handler can distinguish clicks inside vs outside.
          */}
          <div className={styles.sponsor_picker} ref={sponsorWrapRef}>
            {/* Search input */}
            <div
              className={`${styles.sponsor_input_wrap} ${
                selectedSponsor ? styles.sponsor_input_selected : ""
              }`}
            >
              <Search size={14} className={styles.search_icon} />
              <input
                className={styles.sponsor_input}
                placeholder="Search sponsors…"
                value={sponsorSearch}
                onChange={handleSponsorSearchChange}
                onFocus={() => {
                  if (!selectedSponsor) setDropdownOpen(true);
                }}
              />
              {selectedSponsor && (
                <button
                  className={styles.clear_btn}
                  onMouseDown={(e) => {
                    // prevent input blur before clear fires
                    e.preventDefault();
                    handleClearSponsor();
                  }}
                  aria-label="Clear sponsor"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            {/* Dropdown list — only unmounts when closed, never on keystroke */}
            {dropdownOpen && !selectedSponsor && (
              <div className={styles.sponsor_dropdown}>
                {filteredSponsors.length > 0 ? (
                  filteredSponsors.map((s) => (
                    <button
                      key={s.Id}
                      className={styles.sponsor_option}
                      /*
                        onMouseDown + e.preventDefault() is the key fix:
                        it prevents the input from losing focus before the
                        click handler fires, keeping the dropdown stable.
                      */
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSponsorSelect(s);
                      }}
                    >
                      <Building2 size={14} />
                      <span>{s.Title}</span>
                    </button>
                  ))
                ) : (
                  <div className={styles.no_sponsors}>
                    No match —{" "}
                    <button
                      className={styles.create_sponsor_btn}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setNewSponsorName(sponsorSearch);
                        setShowNewSponsor(true);
                        setDropdownOpen(false);
                      }}
                    >
                      create "{sponsorSearch}"
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Selected badge shown below the input */}
          {selectedSponsor && (
            <div className={styles.selected_badge}>
              <CheckCircle2 size={13} />
              <span>{selectedSponsor.Title}</span>
            </div>
          )}
        </div>

        {/* ── Inline new-sponsor form ── */}
        {showNewSponsor && (
          <div className={styles.new_sponsor_box}>
            <p className={styles.new_sponsor_title}>New Sponsor</p>
            <div className={styles.new_sponsor_row}>
              <input
                className={styles.text_input}
                placeholder="Sponsor name"
                value={newSponsorName}
                onChange={(e) => setNewSponsorName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddSponsor()}
                autoFocus
              />
              <button
                className={styles.add_sponsor_btn}
                onClick={handleAddSponsor}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* ── Folder tree preview ── */}
        <div className={styles.folder_preview}>
          <p className={styles.preview_title}>
            Folders to be created ({previewFolders.length})
          </p>
          <div className={styles.folder_list}>
            {previewFolders.map((f, i) => (
              <div
                key={i}
                className={styles.folder_item}
                style={{
                  paddingLeft: `${(f.split("/").length - 1) * 14 + 8}px`,
                }}
              >
                <FolderOpen size={12} />
                <span>{f.split("/").pop()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.modal_footer}>
        <button className={styles.btn_cancel} onClick={onClose}>
          Cancel
        </button>
        <button
          className={styles.btn_submit}
          disabled={!isValid || submitting}
          onClick={handleSubmit}
        >
          {submitting ? (
            <Loader2 size={14} className={styles.spin} />
          ) : (
            <Building2 size={14} />
          )}
          Create Loan
        </button>
      </div>
    </ModalOverlay>
  );
};

export default NewLoanModal;
