// hooks/useEmailService.ts
import { useCallback } from "react";
import { MSGraphClient } from "@microsoft/sp-http";

export interface EmailRecipient {
  email: string;
  name?: string;
}

export interface EmailOptions {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  subject: string;
  htmlBody: string;
  saveToSentItems?: boolean;
}

export const useEmailService = () => {
  const sendEmail = useCallback(
    async (options: EmailOptions, context: any): Promise<boolean> => {
      try {
        const graphClient: MSGraphClient =
          await context.msGraphClientFactory.getClient();

        const emailMessage = {
          message: {
            subject: options.subject,
            body: {
              contentType: "HTML",
              content: options.htmlBody,
            },
            toRecipients: options.to.map((recipient) => ({
              emailAddress: {
                address: recipient.email,
                name: recipient.name || recipient.email,
              },
            })),
            ccRecipients:
              options.cc?.map((recipient) => ({
                emailAddress: {
                  address: recipient.email,
                  name: recipient.name || recipient.email,
                },
              })) || [],
            bccRecipients:
              options.bcc?.map((recipient) => ({
                emailAddress: {
                  address: recipient.email,
                  name: recipient.name || recipient.email,
                },
              })) || [],
          },
          saveToSentItems: options.saveToSentItems !== false,
        };

        await graphClient.api("/me/sendMail").post(emailMessage);

        console.log("Email sent successfully");
        return true;
      } catch (error) {
        console.error("Error sending email:", error);
        return false;
      }
    },
    []
  );

  return {
    sendEmail,
  };
};
