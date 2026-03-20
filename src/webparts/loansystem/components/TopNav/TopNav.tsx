import * as React from "react";
import styles from "./TopNav.module.scss";

interface ITopNavProps {
  activeNav: string;
  setActiveNav: any;
}

const TopNav: React.FC<ITopNavProps> = ({ activeNav, setActiveNav }) => {
  return (
    <div className={styles.top_nav_wrapper}>
      <div>
        <h2 className={styles.logo}>CPC</h2>
      </div>
      <div>
        <ul className={styles.nav_options_wrapper}>
          <li
            className={`${activeNav === "loan" ? styles.active_nav_option : styles.nav_option}`}
            onClick={() => setActiveNav("loan")}
          >
            Loan
          </li>
          <li
            className={`${activeNav === "bulkupload" ? styles.active_nav_option : styles.nav_option}`}
            onClick={() => setActiveNav("bulkupload")}
          >
            Bulk Upload
          </li>
          <li
            className={`${activeNav === "sponsor" ? styles.active_nav_option : styles.nav_option}`}
            onClick={() => setActiveNav("sponsor")}
          >
            Sponsor
          </li>
          <li
            className={`${activeNav === "analysis" ? styles.active_nav_option : styles.nav_option}`}
            onClick={() => setActiveNav("analysis")}
          >
            Analysis
          </li>
        </ul>
      </div>
    </div>
  );
};

export default TopNav;
