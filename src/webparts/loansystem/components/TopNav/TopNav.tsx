/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import styles from "./TopNav.module.scss";
import {
  BankOutlined,
  CloudUploadOutlined,
  ApartmentOutlined,
  BarChartOutlined,
} from "@ant-design/icons";

interface ITopNavProps {
  activeNav: string;
  setActiveNav: any;
}

const NAV_ITEMS = [
  {
    key: "loan",
    label: "Loan",
    icon: <BankOutlined />,
  },
  {
    key: "bulkupload",
    label: "Bulk Upload",
    icon: <CloudUploadOutlined />,
  },
  {
    key: "sponsor",
    label: "Sponsor",
    icon: <ApartmentOutlined />,
  },
  {
    key: "analysis",
    label: "Analysis",
    icon: <BarChartOutlined />,
  },
];

const TopNav: React.FC<ITopNavProps> = ({ activeNav, setActiveNav }) => {
  return (
    <div className={styles.top_nav_wrapper}>
      {/* Logo */}
      <div className={styles.logo_wrapper}>
        <div className={styles.logo_badge}>
          <span>C</span>
        </div>
        <h2 className={styles.logo}>CPC</h2>
      </div>

      {/* Nav Items */}
      <nav>
        <ul className={styles.nav_options_wrapper}>
          {NAV_ITEMS.map(({ key, label, icon }, index) => (
            <li
              key={key}
              className={`${styles.nav_item} ${activeNav === key ? styles.active : ""}`}
              onClick={() => setActiveNav(key)}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className={styles.nav_icon}>{icon}</span>
              <span className={styles.nav_label}>{label}</span>
              {activeNav === key && (
                <span className={styles.active_indicator} />
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default TopNav;
