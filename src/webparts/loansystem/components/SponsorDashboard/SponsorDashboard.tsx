import * as React from "react";
import styles from "./SponsorDashboard.module.scss";
import { useSelector } from "react-redux";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { InputRef, TableColumnsType, TableColumnType } from "antd";
import type { FilterDropdownProps } from "antd/es/table/interface";
import { Button, Input, Space, Table, Tooltip } from "antd";
import { MdModeEdit } from "react-icons/md";

interface userDetails {
  Id: number;
  Title: string;
  Email: string;
}

interface loanDetails {
  name: string;
  Path: string;
  Id: number;
  isFile: boolean;
  SubFolders: loanDetails[];
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

interface DataType {
  Id: React.Key;
  Title: string;
  Description: string;
  Loans: loanDetails[];
}

type DataIndex = keyof DataType;

interface ISponsorDashboardProps {}

const SponsorDashboard: React.FC<ISponsorDashboardProps> = (props) => {
  const loansDetails: any = useSelector(
    (state: any) => state.LoanDetailsContext.loansDetails,
  );
  const sponsorDetails: any = useSelector(
    (state: any) => state.LoanDetailsContext.sponsorDetails,
  );
  const tempSponsorDetails: any = useSelector(
    (state: any) => state.LoanDetailsContext.tempSponsorDetails,
  );

  const searchInput = useRef<InputRef>(null);

  const [tableData, setTableData] = useState<DataType[]>([]);

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

  const columns: TableColumnsType<DataType> = [
    {
      title: "Title",
      dataIndex: "Title",
      key: "Title",
      width: "30%",
      // ...getColumnSearchProps("Sponsor"),
      filters: tempSponsorDetails?.map((sponsor: any) => ({
        text: sponsor.name,
        value: sponsor.name,
      })),
      filterSearch: true,
      onFilter: (value, record) => record.Title === value,
      sorter: (a, b) => (a.Title || "").localeCompare(b.Title || ""),
      sortDirections: ["descend", "ascend"],
      render: (text: string) => (
        <span className={styles.sponsor_name}>{text || "-"}</span>
      ),
    },
    {
      title: "Description",
      dataIndex: "Description",
      key: "Description",
      width: "40%",
      ...getColumnSearchProps("Description"),
      render: (text: string) => (
        <Tooltip placement="leftTop" title={text}>
          <span className={styles.threeLineEllipsis}>{text || "-"}</span>
        </Tooltip>
      ),
    },
    {
      title: "Loan Count",
      dataIndex: "Loans",
      key: "Loans",
      width: "20%",
      // ...getColumnSearchProps("CreatedByTitle"),
      sorter: (a, b) => a?.Loans.length - b?.Loans.length,
      sortDirections: ["descend", "ascend"],
      render: (loans: any[], record: DataType) => {
        console.log(loans, record);

        return <span>{loans?.length || 0}</span>;
      },
    },
    {
      title: "Action",
      dataIndex: "Id",
      key: "Id",
      width: "10%",
      render: (text: string) => (
        <span>
          {React.createElement(MdModeEdit as any, {
            style: { marginRight: "5px", fontSize: "19px", color: "#49AC51" },
          })}
        </span>
      ),
    },
  ];

  useEffect(() => {
    console.log("sponsorDetails", sponsorDetails);
    const loansBySponsor = loansDetails?.reduce((acc: any, loan: any) => {
      if (!acc[loan.Sponsor]) {
        acc[loan.Sponsor] = [];
      }
      acc[loan.Sponsor].push(loan);
      return acc;
    }, {});
    const result = sponsorDetails?.map((sponsor: any) => ({
      ...sponsor,
      Loans: loansBySponsor[sponsor.Title] || [],
    }));
    console.log(result);
    setTableData(result);
  }, [loansDetails || sponsorDetails]);

  return (
    <div className={styles.sponsordashboard_wrapper}>
      <div className={styles.sponsordashboard_header}>
        <div></div>
        <div>
          <Button className="primary-btn" icon={<PlusOutlined />}>
            Sponsor
          </Button>
        </div>
      </div>
      <>
        <Table<DataType>
          columns={columns}
          dataSource={tableData}
          scroll={{ y: 55 * 8 }}
          // pagination={navigationStack?.length === 0 ? { pageSize: 10 } : false}
        />
      </>
    </div>
  );
};

export default SponsorDashboard;
