/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import * as React from "react";
import styles from "./LoanDashboard.module.scss";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import {
  FileAddOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { InputRef, TableColumnsType, TableColumnType } from "antd";
import { Button, Input, Space, Table } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { FcFolder } from "react-icons/fc";
import { FaFileAlt } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { LuChevronsRight } from "react-icons/lu";
import { Avatar } from "antd";
import { FaTag } from "react-icons/fa6";
import { Ellipsis } from "lucide-react";

import { Dropdown, type MenuProps } from "antd";
import {
  ShareAltOutlined,
  LinkOutlined,
  EditOutlined,
  CommentOutlined,
  TeamOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import CustomButton from "../../../../reusablecomponents/button/button";

interface userDetails {
  Id: number;
  Title: string;
  Email: string;
}

interface DataType {
  name: string;
  Path: string;
  Id: number;
  isFile: boolean;
  SubFolders: DataType[];
  Sponsor: string;
  AssetManagement?: any[];
  Servicing: any[];
  Legal: any[];
  CreatedBy: userDetails;
  CreatedByTitle: string;
  ModifiedBy: userDetails;
  Created: string;
  Modified: string;
}

type DataIndex = keyof DataType;

interface ILoanDashboardProps {}

const LoanDashboard: React.FC<ILoanDashboardProps> = (props) => {
  const termMap: any = useSelector(
    (state: any) => state.LoanDetailsContext.termMap,
  );
  const termsOptions: any = useSelector(
    (state: any) => state.LoanDetailsContext.termsOptions,
  );
  const loansDetails: any = useSelector(
    (state: any) => state.LoanDetailsContext.loansDetails,
  );
  const tempSponsorDetails: any = useSelector(
    (state: any) => state.LoanDetailsContext.tempSponsorDetails,
  );
  console.log("tempSponsorDetails", tempSponsorDetails);

  // const [tableData, setTableData] = useState<DataType[]>([]);

  // const [searchText, setSearchText] = useState("");
  // const [searchedColumn, setSearchedColumn] = useState("");
  // // console.log(tableData, searchText, searchedColumn);

  const [navigationStack, setNavigationStack] = useState<DataType[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [activeRowId, setActiveRowId] = useState<number | null>(null);
  console.log("navigationStack", navigationStack, "currentPath", currentPath);

  const searchInput = useRef<InputRef>(null);

  const getCurrentTableData = (): DataType[] => {
    // Root level → show all loans
    if (navigationStack.length === 0) {
      return loansDetails || [];
    }

    // Inside folder → show its SubFolders
    const currentFolder = navigationStack[navigationStack.length - 1];
    return currentFolder.SubFolders || [];
  };

  const handleRowClick = (record: DataType) => {
    // If file → open/download (future)
    if (record.isFile) {
      window.open(record.Path, "_blank");
      return;
    }

    // Folder / Loan → move forward
    setNavigationStack((prev) => [...prev, record]);
    setCurrentPath((prev) => [...prev, record.name]);
  };

  const handleBack = () => {
    setNavigationStack((prev) => prev.slice(0, -1));
    setCurrentPath((prev) => prev.slice(0, -1));
  };

  const handleSearch = (
    selectedKeys: string[],
    confirm: FilterDropdownProps["confirm"],
    dataIndex: DataIndex,
  ) => {
    confirm();
    // setSearchText(selectedKeys[0]);
    // setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    // setSearchText("");
  };

  const activeSection = useMemo(() => {
    if (navigationStack.length < 2) return null;

    // const loanNumber = navigationStack[0]?.name;
    const section = navigationStack[1]?.name;

    // if (loanNumber !== "3000101") return null;

    if (section === "Asset Management") return "ASSET";
    if (section === "CSP Legal") return "LEGAL";
    if (section === "Servicing") return "SERVICING";

    return null;
  }, [navigationStack]);

  const getColumnSearchProps = (
    dataIndex: DataIndex,
  ): TableColumnType<DataType> => ({
    filterDropdown: ({
      setSelectedKeys,
      selectedKeys,
      confirm,
      clearFilters,
      close,
    }) => (
      <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) =>
            setSelectedKeys(e.target.value ? [e.target.value] : [])
          }
          onPressEnter={() =>
            handleSearch(selectedKeys as string[], confirm, dataIndex)
          }
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() =>
              handleSearch(selectedKeys as string[], confirm, dataIndex)
            }
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Reset
          </Button>
          {/* <Button
            type="link"
            size="small"
            onClick={() => {
              confirm({ closeDropdown: false });
              // setSearchText((selectedKeys as string[])[0]);
              // setSearchedColumn(dataIndex);
            }}
          >
            Filter
          </Button> */}
          <Button
            type="link"
            size="small"
            onClick={() => {
              close();
            }}
          >
            close
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? "#1677ff" : undefined }} />
    ),
    onFilter: (value, record) =>
      (record[dataIndex] ?? "")
        .toString()
        .toLowerCase()
        .includes((value as string).toLowerCase()),
    onFilterDropdownOpenChange: (open: boolean) => {
      if (open) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  });

  const navigateToUnderwriting = (loan: DataType) => {
    if (!loan?.SubFolders?.length) return;

    const assetManagementFolder = loan.SubFolders.find(
      (f) => f.name === "Asset Management",
    );

    if (!assetManagementFolder?.SubFolders?.length) return;

    const underwritingFolder = assetManagementFolder.SubFolders.find(
      (f) => f.name === "Underwriting",
    );

    if (!underwritingFolder) return;

    setNavigationStack([loan, assetManagementFolder, underwritingFolder]);

    setCurrentPath([
      loan.name,
      assetManagementFolder.name,
      underwritingFolder.name,
    ]);
  };

  const getRowActionMenu = (record: DataType): MenuProps["items"] => [
    {
      key: "share",
      icon: <ShareAltOutlined />,
      label: "Share",
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        console.log("Share", record);
      },
    },
    {
      key: "copy-link",
      icon: <LinkOutlined />,
      label: "Copy link",
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        navigator.clipboard.writeText(record.Path);
      },
    },
    {
      key: "edit",
      icon: <EditOutlined />,
      label: "Edit",
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        console.log("Edit", record);
      },
    },
    {
      key: "comment",
      icon: <CommentOutlined />,
      label: "Comment",
      onClick: ({ domEvent }) => domEvent.stopPropagation(),
    },
    {
      key: "manage-access",
      icon: <TeamOutlined />,
      label: "Manage access",
      onClick: ({ domEvent }) => domEvent.stopPropagation(),
    },
    { type: "divider" },
    {
      key: "delete",
      icon: <DeleteOutlined />,
      label: "Delete",
      danger: true,
      onClick: ({ domEvent }) => {
        domEvent.stopPropagation();
        console.log("Delete", record);
      },
    },
    { type: "divider" },
    {
      key: "details",
      icon: <InfoCircleOutlined />,
      label: "Details",
      onClick: ({ domEvent }) => domEvent.stopPropagation(),
    },
    // {
    //   key: "more",
    //   label: "More",
    //   children: [
    //     { key: "more-1", label: "Check Out" },
    //     { key: "more-2", label: "Compliance details" },
    //   ],
    // },
  ];

  const baseColumns: TableColumnsType<DataType> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      width: "20%",
      ...getColumnSearchProps("name"),
      render: (text: string, record: DataType) => (
        <div
          className={styles.Title_Section}
          onMouseEnter={(e) => {
            const ellipsis = e.currentTarget.querySelector(
              ".ellipsis-icon",
            ) as HTMLElement;
            if (ellipsis) ellipsis.style.visibility = "visible";
          }}
          onMouseLeave={(e) => {
            const ellipsis = e.currentTarget.querySelector(
              ".ellipsis-icon",
            ) as HTMLElement;
            if (ellipsis) ellipsis.style.visibility = "hidden";
          }}
        >
          <span
            className={styles.loannumber}
            onClick={() => handleRowClick(record)}
          >
            {record.isFile
              ? React.createElement(FaFileAlt as any, {
                  style: { marginRight: "5px", fontSize: "19px" },
                })
              : React.createElement(FcFolder as any, {
                  style: { marginRight: "5px", fontSize: "19px" },
                })}
            {text || "-"}
          </span>
          <Dropdown
            menu={{ items: getRowActionMenu(record) }}
            trigger={["click"]}
            onOpenChange={(open) => setActiveRowId(open ? record.Id : null)}
            placement="bottomLeft"
            align={{ offset: [30, 0] }}
          >
            <span
              className={`${styles.ellipsis_icon} ${activeRowId === record.Id ? styles.ellipsis_active : ""}`}
              onClick={(e) => e.stopPropagation()}
            >
              <Ellipsis className={styles.Action_icon} size={25} />
            </span>
          </Dropdown>
        </div>
      ),
    },
    {
      title: "Sponsor",
      dataIndex: "Sponsor",
      key: "Sponsor",
      width: "15%",
      // ...getColumnSearchProps("Sponsor"),
      filters:
        navigationStack.length !== 0
          ? [
              {
                text: navigationStack[0]?.Sponsor,
                value: navigationStack[0]?.Sponsor,
              },
            ]
          : tempSponsorDetails?.map((sponsor: any) => ({
              text: sponsor.name,
              value: sponsor.name,
            })),
      filterSearch: true,
      onFilter: (value, record) => record.Sponsor === value,
      sorter: (a, b) => (a.Sponsor || "").localeCompare(b.Sponsor || ""),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => (
        <span className={styles.sponsor_name}>{text || "-"}</span>
      ),
    },
    {
      title: "Created At",
      dataIndex: "Created",
      key: "Created",
      width: "10%",
      ...getColumnSearchProps("Created"),
      sorter: (a, b) => {
        const parseDate = (value: string) => {
          if (!value) return 0;
          const [day, month, year] = value.split("/").map(Number);
          return new Date(year, month - 1, day).getTime();
        };
        return parseDate(a.Created) - parseDate(b.Created);
      },
      sortDirections: ["descend", "ascend"],
      render: (text: string) => (
        <span className={styles.created_by}>{text || "-"}</span>
      ),
    },
    {
      title: "Created By",
      dataIndex: "CreatedByTitle",
      key: "CreatedByTitle",
      width: "15%",
      ...getColumnSearchProps("CreatedByTitle"),
      sorter: (a, b) => a.CreatedByTitle.length - b.CreatedByTitle.length,
      sortDirections: ["descend", "ascend"],
      render: (text: string, record: DataType) => (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Avatar
            shape="square"
            size="small"
            src={
              "/_layouts/15/userphoto.aspx?size=S&username=" +
              `${record?.CreatedBy?.Email}`
            }
          />
          <span className={styles.created_by} style={{ fontWeight: "500" }}>
            {text || "-"}
          </span>
        </div>
      ),
    },
    {
      title: "Modified At",
      dataIndex: "Modified",
      key: "Modified",
      width: "15%",
      ...getColumnSearchProps("Modified"),
      sorter: (a, b) => {
        const parseDate = (value: string) => {
          if (!value) return 0;
          const [day, month, year] = value.split("/").map(Number);
          return new Date(year, month - 1, day).getTime();
        };
        return parseDate(a.Modified) - parseDate(b.Modified);
      },
      sortDirections: ["descend", "ascend"],
      render: (text: string) => (
        <span className={styles.created_by}>{text || "-"}</span>
      ),
    },
    {
      title: "Link",
      dataIndex: "Id",
      key: "Id",
      width: "10%",
      render: (text: string, record: DataType) => (
        <span
          className={styles.underwriting_link}
          onClick={() => navigateToUnderwriting(record)}
        >
          Underwriting
        </span>
      ),
    },
    // {
    //   title: "Action",
    //   dataIndex: "Id",
    //   key: "Id",
    //   width: "10%",
    //   render: (text: string) => (
    //     <span>
    //       {React.createElement(MdModeEdit as any, {
    //         style: { marginRight: "5px", fontSize: "19px", color: "#49AC51" },
    //       })}
    //     </span>
    //   ),
    // },
  ];

  const conditionalColumns: TableColumnsType<DataType> = [];

  if (activeSection === "ASSET") {
    conditionalColumns.push({
      title: "Asset Management",
      dataIndex: "AssetManagement",
      key: "AssetManagement",
      width: "20%",
      render: (v: any[]) => (
        <div className={styles.tagsList}>
          {v?.map((am, idx) => (
            <span key={idx} className={styles.termChip}>
              {React.createElement(FaTag as any, {
                style: { fontSize: "9px", color: "#0a2e5c" },
              })}
              {am?.Label}
            </span>
          ))}
        </div>
      ),
    });
  }

  if (activeSection === "LEGAL") {
    conditionalColumns.push({
      title: "Legal",
      dataIndex: "Legal",
      key: "Legal",
      width: "20%",
      render: (v: any[]) => (
        <div className={styles.tagsList}>
          {v?.map((am, idx) => (
            <span key={idx} className={styles.termChip}>
              {React.createElement(FaTag as any, {
                style: { fontSize: "9px", color: "#0a2e5c" },
              })}
              {am?.Label}
            </span>
          ))}
        </div>
      ),
    });
  }

  if (activeSection === "SERVICING") {
    conditionalColumns.push({
      title: "Servicing",
      dataIndex: "Servicing",
      key: "Servicing",
      width: "20%",
      render: (v: any[]) => (
        <div className={styles.tagsList}>
          {v?.map((am, idx) => (
            <span key={idx} className={styles.termChip}>
              {React.createElement(FaTag as any, {
                style: { fontSize: "9px", color: "#0a2e5c" },
              })}
              {am?.Label}
            </span>
          ))}
        </div>
      ),
    });
  }

  const columns: TableColumnsType<DataType> = [
    baseColumns[0], // Name
    baseColumns[1], // Sponsor
    ...conditionalColumns,
    ...baseColumns.slice(2).filter((col) => {
      if (activeSection !== null && col.key === "Created") {
        return false;
      } else if (col.title === "Link" && navigationStack.length !== 0) {
        return false;
      } else {
        return true;
      }
    }),
  ];

  useEffect(() => {
    console.log("termMap", termMap);
    console.log("termsOptions", termsOptions);
    console.log("loansDetails", loansDetails);
    // if (loansDetails?.length > 0) {
    //   setTableData(loansDetails);
    // }
  }, [loansDetails]);

  // const addSponsors = async () => {
  //   console.log("Add Sponsors");
  //   if (sponsorDetails?.length !== 0) {
  //     sponsorDetails.forEach(async (sponsor: any, index: Number) => {
  //       console.log(index);
  //       await sp.web.lists.getByTitle("Sponsors").items.add({
  //         Title: sponsor.name,
  //       });
  //     });
  //   }
  // };

  return (
    <div className={styles.loandashboard_wrapper}>
      <div className={styles.loandashboard_header}>
        <div className={styles.breadcrumbs}>
          {navigationStack.length > 0 &&
            React.createElement(IoArrowBack as any, {
              style: {
                marginRight: "15px",
                fontSize: "19px",
                cursor: "pointer",
              },
              onClick: handleBack,
            })}

          <span
            onClick={() => {
              setNavigationStack([]);
              setCurrentPath([]);
            }}
            className="cursor_pointer"
            style={{
              fontWeight: "500",
              color: navigationStack?.length === 0 ? "#000000" : "#A7A7A7",
            }}
          >
            CSP Loan Files
          </span>

          {navigationStack.map((item, index) => (
            <span
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
                marginLeft: "5px",
              }}
            >
              {React.createElement(LuChevronsRight as any, {
                style: { fontSize: "19px", color: "#49AC51" },
              })}
              <span
                onClick={() => {
                  setNavigationStack(navigationStack.slice(0, index + 1));
                  setCurrentPath(currentPath.slice(0, index + 1));
                }}
                className="cursor_pointer"
                style={{
                  fontWeight: "500",
                  color:
                    navigationStack?.length - 1 === index
                      ? "#000000"
                      : "#A7A7A7",
                }}
              >
                {item.name}
              </span>
            </span>
          ))}
        </div>
        <div className={styles.button_group}>
          <CustomButton
            type="primary"
            label="Add File"
            icon={<FileAddOutlined />}
            onClick={() => console.log("primary")}
          />
          <CustomButton
            type="primary"
            label="Loan"
            icon={<PlusOutlined />}
            onClick={() => console.log("primary")}
          />
          {/* <Button
            className="primary-btn"
            icon={<FileAddOutlined style={{ strokeWidth: "1.5" }} />}
          >
            Add file
          </Button>
          <Button
            className="primary-btn"
            icon={<PlusOutlined style={{ transform: "scale(1.2)" }} />}
          >
            Loan
          </Button> */}
        </div>
      </div>
      <>
        <Table<DataType>
          columns={columns}
          dataSource={getCurrentTableData()}
          scroll={{ y: 55 * 8 }}
          rowClassName={(record) =>
            activeRowId === record.Id ? styles.active_row : ""
          }
          // pagination={navigationStack?.length === 0 ? { pageSize: 10 } : false}
        />
      </>
    </div>
  );
};

export default LoanDashboard;
