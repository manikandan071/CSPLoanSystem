import * as React from "react";
import { LuChevronsRight } from "react-icons/lu";
import styles from "../../webparts/loansystem/components/LoanDashboard/LoanDashboard.module.scss";
import { IoArrowBack } from "react-icons/io5";
import { ILoanTree } from "../../interfaces/loandocument";

interface BreadcrumbNavProps {
  navigationStack: ILoanTree[];
  onBack: () => void;
  onReset: () => void;
  onNavigateToIndex: (index: number) => void;
}

/**
 * Renders the breadcrumb trail and back-arrow for the Loan Dashboard.
 * Clicking any crumb navigates to that level; the back arrow pops one level.
 */
const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  navigationStack,
  onBack,
  onReset,
  onNavigateToIndex,
}) => {
  const isRoot = navigationStack.length === 0;

  return (
    <nav className={styles.breadcrumbs} aria-label="Loan folder navigation">
      {
        !isRoot &&
          React.createElement(IoArrowBack as any, {
            style: {
              marginRight: "15px",
              fontSize: "19px",
              cursor: "pointer",
            },
            onClick: onBack,
          })
        // <IoArrowBack
        //   style={{ marginRight: "15px", fontSize: "19px", cursor: "pointer" }}
        //   onClick={onBack}
        //   aria-label="Go back"
        //   role="button"
        //   tabIndex={0}
        //   onKeyDown={(e) => e.key === "Enter" && onBack()}
        // />
      }

      {/* Root crumb */}
      <span
        onClick={onReset}
        className={styles.breadcrumb_crumb}
        style={{ color: isRoot ? "#000000" : "#A7A7A7" }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onReset()}
        aria-current={isRoot ? "page" : undefined}
      >
        CSP Loan Files
      </span>

      {/* Dynamic crumbs */}
      {navigationStack.map((item, index) => {
        const isLast = index === navigationStack.length - 1;
        return (
          <span
            key={`${item.name}-${index}`}
            className={styles.breadcrumb_segment}
          >
            {React.createElement(LuChevronsRight as any, {
              style: { fontSize: "19px", color: "#49AC51" },
            })}
            <span
              onClick={() => onNavigateToIndex(index)}
              className={styles.breadcrumb_crumb}
              style={{ color: isLast ? "#000000" : "#A7A7A7" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onNavigateToIndex(index)}
              aria-current={isLast ? "page" : undefined}
            >
              {item.name}
            </span>
          </span>
        );
      })}
    </nav>
  );
};

export default BreadcrumbNav;
