/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-floating-promises */
import type { MenuProps } from "antd";
import {
  ShareAltOutlined,
  LinkOutlined,
  EditOutlined,
  CommentOutlined,
  TeamOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import * as React from "react";
import { ILoanTree } from "../../interfaces/loandocument";

/**
 * Returns the context-menu items for a given row.
 * Separated from the component so it can be unit-tested and reused independently.
 *
 * NOTE: Replace the `console.log` stubs with real action dispatchers once available.
 */
export const getRowActionMenu = (record: ILoanTree): MenuProps["items"] => [
  {
    key: "share",
    icon: <ShareAltOutlined />,
    label: "Share",
    onClick: ({ domEvent }) => {
      domEvent.stopPropagation();
      // TODO: dispatch share action
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
      // TODO: dispatch edit action
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
      // TODO: dispatch delete action
    },
  },
  { type: "divider" },
  {
    key: "details",
    icon: <InfoCircleOutlined />,
    label: "Details",
    onClick: ({ domEvent }) => domEvent.stopPropagation(),
  },
];
