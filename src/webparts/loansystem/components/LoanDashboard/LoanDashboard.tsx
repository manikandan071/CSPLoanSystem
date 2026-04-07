/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import * as React from "react";
import { useSelector } from "react-redux";
import { Table } from "antd";
import { useMemo, useState } from "react";
import { ILoanTree } from "../../../../interfaces/loandocument";
import { ActiveSection } from "../../../../types/loan.types";
import { useNavigation } from "../../../../hooks/loantab/useNavigation";
import { useTableColumns } from "../../../../hooks/loantab/useTableColumns";
import BreadcrumbNav from "../../../../reusablecomponents/Breadcrumbnav/Breadcrumbnav";
import styles from "./LoanDashboard.module.scss";
import CreateUploadMenu from "./CreateUploadMenu/CreateUploadMenu";
import { RootState } from "../../../../interfaces/common";

// ─── Redux state selectors ─────────────────────────────────────────────────────
// Typed selectors reduce the `any` surface. Update RootState once your Redux
// store is typed end-to-end.

const SECTION_NAME_MAP: Record<string, ActiveSection> = {
  "Asset Management": "ASSET",
  "CSP Legal": "LEGAL",
  Servicing: "SERVICING",
};

const LoanDashboard: React.FC = () => {
  // ─── Store ─────────────────────────────────────────────────────────────────
  const loansDetails: ILoanTree[] = useSelector(
    (state: RootState) => state.LoanDetailsContext.loansDetails,
  );
  const tempSponsorDetails = useSelector(
    (state: RootState) => state.LoanDetailsContext.tempSponsorDetails,
  );

  // ─── Local UI state ────────────────────────────────────────────────────────
  const [activeRowId, setActiveRowId] = useState<number | null>(null);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const {
    navigationStack,
    navigateTo,
    navigateBack,
    navigateToIndex,
    resetNavigation,
    navigateToPath,
  } = useNavigation();

  // ─── Derived data ──────────────────────────────────────────────────────────
  const currentTableData = useMemo((): ILoanTree[] => {
    if (navigationStack.length === 0) return loansDetails ?? [];
    let currentNodes: ILoanTree[] = loansDetails ?? [];
    for (const stackNode of navigationStack) {
      const matched = currentNodes.find((n) => n.Id === stackNode.Id);
      if (!matched) return currentNodes;
      currentNodes = matched.SubFolders ?? [];
    }

    return currentNodes;
  }, [navigationStack, loansDetails]);

  const currentSponsor = useMemo(() => {
    if (navigationStack.length === 0) return undefined;
    return (navigationStack[0] as any)?.Sponsor as string | undefined;
  }, [navigationStack]);

  const allSponsorLoans = useMemo(() => {
    return (loansDetails ?? []).map((loan) => ({
      sponsor: loan.Sponsor,
      loanNumber: loan.name,
      basePath: loan.Path,
    }));
  }, [loansDetails]);

  /**
   * Derives which section context we're in so contextual columns can be shown.
   * Only meaningful when ≥ 2 levels deep (loan → section).
   */
  const activeSection = useMemo((): ActiveSection => {
    if (navigationStack.length < 2) return null;
    return SECTION_NAME_MAP[navigationStack[1]?.name] ?? null;
  }, [navigationStack]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleRowClick = (record: ILoanTree) => {
    if (record.isFile) {
      window.open(record.Path, "_blank", "noopener,noreferrer");
      return;
    }
    navigateTo(record);
  };

  /**
   * Shortcut that jumps directly to the Underwriting sub-folder of a loan.
   * Silently no-ops if the expected folder structure is missing.
   */
  const handleUnderwritingClick = (loan: ILoanTree) => {
    const assetManagement = loan.SubFolders?.find(
      (f) => f.name === "Asset Management",
    );
    const underwriting = assetManagement?.SubFolders?.find(
      (f) => f.name === "Underwriting",
    );
    if (!assetManagement || !underwriting) return;

    navigateToPath(
      [loan, assetManagement, underwriting],
      [loan.name, assetManagement.name, underwriting.name],
    );
  };

  // ─── Columns ───────────────────────────────────────────────────────────────
  const columns = useTableColumns({
    navigationStack,
    activeSection,
    activeRowId,
    tempSponsorDetails: tempSponsorDetails ?? [],
    onRowClick: handleRowClick,
    onUnderwritingClick: handleUnderwritingClick,
    onActiveRowChange: setActiveRowId,
  });

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className={styles.loandashboard_wrapper}>
      {/* ── Header ── */}
      <header className={styles.loandashboard_header}>
        <BreadcrumbNav
          navigationStack={navigationStack}
          onBack={navigateBack}
          onReset={resetNavigation}
          onNavigateToIndex={navigateToIndex}
        />

        <div className={styles.button_group}>
          <CreateUploadMenu
            navigationStack={navigationStack}
            currentSponsor={currentSponsor}
            allSponsorLoans={allSponsorLoans}
          />
        </div>
      </header>

      {/* ── Table ── */}
      <Table<ILoanTree>
        columns={columns}
        dataSource={currentTableData}
        rowKey="Id"
        scroll={{ y: 55 * 8 }}
        rowClassName={(record) =>
          activeRowId === record.Id ? styles.active_row : ""
        }
        pagination={navigationStack.length === 0 ? { pageSize: 10 } : false}
      />
    </div>
  );
};

export default LoanDashboard;
