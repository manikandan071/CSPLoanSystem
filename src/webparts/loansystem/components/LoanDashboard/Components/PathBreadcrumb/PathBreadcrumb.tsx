import * as React from "react";
import { ChevronRight } from "lucide-react";
import styles from "./PathBreadcrumb.module.scss";

interface PathBreadcrumbProps {
  path: string;
}

const PathBreadcrumb: React.FC<PathBreadcrumbProps> = ({ path }) => {
  const parts = path ? path.split("/").filter(Boolean) : ["Root"];

  return (
    <div className={styles.path_breadcrumb}>
      <span className={styles.path_label}>Current path</span>
      <div className={styles.path_parts}>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight size={12} className={styles.path_sep} />}
            <span className={styles.path_part}>{part}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PathBreadcrumb;
