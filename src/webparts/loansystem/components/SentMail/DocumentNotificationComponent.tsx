/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react";
import {
  PrimaryButton,
  DefaultButton,
  MessageBar,
  MessageBarType,
  Spinner,
} from "@fluentui/react";
import { useEmailService } from "./useEmailService";
import { useEmailTemplates } from "./useEmailTemplates";

interface DocumentNotificationComponentProps {
  document: {
    name: string;
    url: string;
    submittedBy: string;
  };
  approvers: Array<{ email: string; name: string }>;
  context: any;
}

export const DocumentNotificationComponent: React.FC<
  DocumentNotificationComponentProps
> = ({ document, approvers, context }) => {
  const { sendEmail } = useEmailService();
  const { getDocumentApprovalTemplate } = useEmailTemplates();

  const [isSending, setIsSending] = React.useState(false);
  const [notificationStatus, setNotificationStatus] = React.useState<{
    type: MessageBarType;
    message: string;
  } | null>(null);

  const handleSendApprovalNotification = async () => {
    setIsSending(true);
    setNotificationStatus(null);

    try {
      const emailBody = getDocumentApprovalTemplate(
        document.name,
        document.url,
        document.submittedBy,
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 7 days from now
      );

      const success = await sendEmail(
        {
          to: approvers,
          subject: `Approval Required: ${document.name}`,
          htmlBody: emailBody,
          saveToSentItems: true,
        },
        context,
      );

      if (success) {
        setNotificationStatus({
          type: MessageBarType.success,
          message: `Approval notification sent successfully to ${approvers.length} approver(s)`,
        });
      } else {
        setNotificationStatus({
          type: MessageBarType.error,
          message: "Failed to send approval notification",
        });
      }
    } catch (error) {
      setNotificationStatus({
        type: MessageBarType.error,
        message: `Error sending notification: ${error.message}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSendStatusUpdate = async (status: string, comments?: string) => {
    setIsSending(true);
    setNotificationStatus(null);

    try {
      const { getDocumentStatusUpdateTemplate } = useEmailTemplates();

      const emailBody = getDocumentStatusUpdateTemplate(
        document.name,
        status,
        "System", // or current user
        comments,
        document.url,
      );

      // Send to relevant stakeholders based on status
      const success = await sendEmail(
        {
          to: approvers, // or different recipients based on your logic
          subject: `Document Status Update: ${document.name} - ${status}`,
          htmlBody: emailBody,
        },
        context,
      );

      if (success) {
        setNotificationStatus({
          type: MessageBarType.success,
          message: `Status update notification sent successfully`,
        });
      } else {
        setNotificationStatus({
          type: MessageBarType.error,
          message: "Failed to send status update notification",
        });
      }
    } catch (error) {
      setNotificationStatus({
        type: MessageBarType.error,
        message: `Error sending status update: ${error.message}`,
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div>
      {notificationStatus && (
        <MessageBar messageBarType={notificationStatus.type}>
          {notificationStatus.message}
        </MessageBar>
      )}

      <div style={{ marginTop: 20 }}>
        <PrimaryButton
          onClick={handleSendApprovalNotification}
          disabled={isSending}
          style={{ marginRight: 10 }}
        >
          {isSending ? <Spinner size={1} /> : "Send Approval Request"}
        </PrimaryButton>

        <DefaultButton
          onClick={() =>
            handleSendStatusUpdate("In Review", "Document is now under review")
          }
          disabled={isSending}
        >
          Send Status Update
        </DefaultButton>
      </div>
    </div>
  );
};
