import { useRef, useCallback } from "react";
import type { InputRef, TableColumnsType, TableColumnType } from "antd";
import { Button, Input, Space, Avatar } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { FcFolder } from "react-icons/fc";
import { FaFileAlt } from "react-icons/fa";
import { FaTag } from "react-icons/fa6";
import { Ellipsis, Sparkles } from "lucide-react";
import { Dropdown } from "antd";
import * as React from "react";
import { getRowActionMenu } from "./useRowActionMenu";
import styles from "../../webparts/loansystem/components/LoanDashboard/LoanDashboard.module.scss";
import {
  getUserPhotoUrl,
  isRecentlyCreated,
  parseDDMMYYYY,
} from "../../utils/CommonUtils";
import { ILoanTree } from "../../interfaces/loandocument";
import { ActiveSection, DataIndex } from "../../types/loan.types";

interface UseTableColumnsOptions {
  navigationStack: ILoanTree[];
  activeSection: ActiveSection;
  activeRowId: number | null;
  tempSponsorDetails: Array<{ name: string }>;
  onRowClick: (record: ILoanTree) => void;
  onUnderwritingClick: (record: ILoanTree) => void;
  onActiveRowChange: (id: number | null) => void;
}

/** Column-search filter factory – shared across columns. */
const useColumnSearch = () => {
  const searchInput = useRef<InputRef>(null);

  const getColumnSearchProps = useCallback(
    (dataIndex: DataIndex): TableColumnType<ILoanTree> => ({
      filterDropdown: ({
        setSelectedKeys,
        selectedKeys,
        confirm,
        clearFilters,
        close,
      }: FilterDropdownProps) => (
        <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
          <Input
            ref={searchInput}
            placeholder={`Search ${dataIndex}`}
            value={selectedKeys[0]}
            onChange={(e) =>
              setSelectedKeys(e.target.value ? [e.target.value] : [])
            }
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: "block" }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
              style={{ width: 90 }}
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters && clearFilters()}
              size="small"
              style={{ width: 90 }}
            >
              Reset
            </Button>
            <Button type="link" size="small" onClick={close}>
              Close
            </Button>
          </Space>
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
      ),
      onFilter: (value, record) =>
        (record[dataIndex as keyof ILoanTree] ?? "")
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase()),
      onFilterDropdownOpenChange: (open) => {
        if (open) setTimeout(() => searchInput.current?.select(), 100);
      },
    }),
    [],
  );

  return { getColumnSearchProps };
};

/** Tag chip used in conditional section columns. */
const TagChip: React.FC<{ label: string }> = ({ label }) => (
  <span className={styles.termChip}>
    {React.createElement(FaTag as any, {
      style: { fontSize: "9px", color: "#0a2e5c" },
    })}
    {label}
  </span>
);

/** Renders the section-specific tag list columns (Asset / Legal / Servicing). */
const buildSectionColumn = (
  title: string,
  dataIndex: string,
): TableColumnsType<ILoanTree>[number] => ({
  title,
  dataIndex,
  key: dataIndex,
  width: "20%",
  render: (items: Array<{ Label: string }>) => (
    <div className={styles.tagsList}>
      {items?.map((item, idx) => (
        <TagChip key={idx} label={item.Label} />
      ))}
    </div>
  ),
});

/**
 * Builds the full column definition array for the Loan table,
 * including search, sort, conditional section columns, and row actions.
 */
export const useTableColumns = ({
  navigationStack,
  activeSection,
  activeRowId,
  tempSponsorDetails,
  onRowClick,
  onUnderwritingClick,
  onActiveRowChange,
}: UseTableColumnsOptions): TableColumnsType<ILoanTree> => {
  const { getColumnSearchProps } = useColumnSearch();

  // ─── Name column ────────────────────────────────────────────────────────────
  const nameColumn: TableColumnsType<ILoanTree>[number] = {
    title: "Name",
    dataIndex: "name",
    key: "name",
    width: "20%",
    ...getColumnSearchProps("name"),
    render: (text: string, record: ILoanTree) => (
      <div
        className={styles.Title_Section}
        onMouseEnter={(e) => {
          (e.currentTarget.querySelector(".ellipsis-icon") as HTMLElement)
            ?.style &&
            ((
              e.currentTarget.querySelector(".ellipsis-icon") as HTMLElement
            ).style.visibility = "visible");
        }}
        onMouseLeave={(e) => {
          (e.currentTarget.querySelector(".ellipsis-icon") as HTMLElement)
            ?.style &&
            ((
              e.currentTarget.querySelector(".ellipsis-icon") as HTMLElement
            ).style.visibility = "hidden");
        }}
      >
        <span
          className={styles.loannumber}
          onClick={() => onRowClick(record)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onRowClick(record)}
        >
          {record.isFile
            ? React.createElement(FaFileAlt as any, {
                style: { marginRight: "5px", fontSize: "19px" },
              })
            : React.createElement(FcFolder as any, {
                style: { marginRight: "5px", fontSize: "19px" },
              })}
          {text || "-"}
          {isRecentlyCreated(record.Created) && (
            <span>
              <Sparkles
                size={8}
                style={{ marginRight: 3 }}
                fill="#2563eb"
                color="#2563eb"
              />
            </span>
          )}
        </span>

        <Dropdown
          menu={{ items: getRowActionMenu(record) }}
          trigger={["click"]}
          onOpenChange={(open) => onActiveRowChange(open ? record.Id : null)}
          placement="bottomLeft"
          align={{ offset: [30, 0] }}
        >
          <span
            className={`${styles.ellipsis_icon} ${
              activeRowId === record.Id ? styles.ellipsis_active : ""
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <Ellipsis className={styles.Action_icon} size={25} />
          </span>
        </Dropdown>
      </div>
    ),
  };

  // ─── Sponsor column ─────────────────────────────────────────────────────────
  const sponsorFilters =
    navigationStack.length !== 0
      ? [
          {
            text: navigationStack[0]?.Sponsor,
            value: navigationStack[0]?.Sponsor,
          },
        ]
      : tempSponsorDetails?.map((s) => ({ text: s.name, value: s.name }));

  const sponsorColumn: TableColumnsType<ILoanTree>[number] = {
    title: "Sponsor",
    dataIndex: "Sponsor",
    key: "Sponsor",
    width: "15%",
    filters: sponsorFilters,
    filterSearch: true,
    onFilter: (value, record) => record.Sponsor === value,
    sorter: (a, b) => (a.Sponsor || "").localeCompare(b.Sponsor || ""),
    sortDirections: ["descend", "ascend"],
    render: (text: string) => (
      <span className={styles.sponsor_name}>{text || "-"}</span>
    ),
  };

  // ─── Date / user columns ─────────────────────────────────────────────────────
  const createdAtColumn: TableColumnsType<ILoanTree>[number] = {
    title: "Created At",
    dataIndex: "Created",
    key: "Created",
    width: "10%",
    ...getColumnSearchProps("Created"),
    sorter: (a, b) => parseDDMMYYYY(a.Created) - parseDDMMYYYY(b.Created),
    sortDirections: ["descend", "ascend"],
    render: (text: string) => (
      <span className={styles.created_by}>{text || "-"}</span>
    ),
  };

  const createdByColumn: TableColumnsType<ILoanTree>[number] = {
    title: "Created By",
    dataIndex: "CreatedByTitle",
    key: "CreatedByTitle",
    width: "15%",
    ...getColumnSearchProps("CreatedByTitle"),
    sorter: (a, b) => a.CreatedByTitle.length - b.CreatedByTitle.length,
    sortDirections: ["descend", "ascend"],
    render: (text: string, record: ILoanTree) => (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <Avatar
          shape="square"
          size="small"
          src={getUserPhotoUrl(record?.CreatedBy?.Email)}
        />
        <span className={styles.created_by} style={{ fontWeight: 500 }}>
          {text || "-"}
        </span>
      </div>
    ),
  };

  const modifiedAtColumn: TableColumnsType<ILoanTree>[number] = {
    title: "Modified At",
    dataIndex: "Modified",
    key: "Modified",
    width: "15%",
    ...getColumnSearchProps("Modified"),
    sorter: (a, b) => parseDDMMYYYY(a.Modified) - parseDDMMYYYY(b.Modified),
    sortDirections: ["descend", "ascend"],
    render: (text: string) => (
      <span className={styles.created_by}>{text || "-"}</span>
    ),
  };

  const linkColumn: TableColumnsType<ILoanTree>[number] = {
    title: "Link",
    dataIndex: "Id",
    key: "Id",
    width: "10%",
    render: (_: string, record: ILoanTree) => (
      <span
        className={styles.underwriting_link}
        onClick={() => onUnderwritingClick(record)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onUnderwritingClick(record)}
      >
        Underwriting
      </span>
    ),
  };

  // ─── Conditional section columns ────────────────────────────────────────────
  const conditionalColumns: TableColumnsType<ILoanTree> = [];
  if (activeSection === "ASSET")
    conditionalColumns.push(
      buildSectionColumn("Asset Management", "AssetManagement"),
    );
  if (activeSection === "LEGAL")
    conditionalColumns.push(buildSectionColumn("Legal", "Legal"));
  if (activeSection === "SERVICING")
    conditionalColumns.push(buildSectionColumn("Servicing", "Servicing"));

  // ─── Assembly: Name → Sponsor → conditional → date/user → optional Link ────
  return [
    nameColumn,
    sponsorColumn,
    ...conditionalColumns,
    ...(activeSection ? [] : [createdAtColumn]), // hide Created At when inside a section
    createdByColumn,
    modifiedAtColumn,
    ...(navigationStack.length === 0 ? [linkColumn] : []), // only at root
  ];
};
