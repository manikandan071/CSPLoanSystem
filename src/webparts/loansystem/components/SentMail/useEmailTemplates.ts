/* eslint-disable @typescript-eslint/explicit-function-return-type */
// hooks/useEmailTemplates.ts
import { useCallback } from "react";
export const useEmailTemplates = () => {
  const getDocumentApprovalTemplate = useCallback(
    (
      documentName: string,
      documentUrl: string,
      submittedBy: string,
      dueDate?: string,
    ): string => {
      return `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
            .header { background: #0078d4; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #faf9f8; }
            .document-card { background: white; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #0078d4; }
            .button { display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e1dfdd; }
            .info-item { margin: 10px 0; }
            .label { font-weight: 600; color: #605e5c; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>Document Approval Required</h1>
              </div>
              <div class="content">
                  <p>Dear Approver,</p>
                  <p>You have been requested to review and approve the following document:</p>
                  
                  <div class="document-card">
                      <h3 style="margin-top: 0; color: #0078d4;">${documentName}</h3>
                      <div class="info-item">
                          <span class="label">Submitted by:</span> ${submittedBy}
                      </div>
                      <div class="info-item">
                          <span class="label">Submission date:</span> ${new Date().toLocaleDateString()}
                      </div>
                      ${
                        dueDate
                          ? `
                      <div class="info-item">
                          <span class="label">Due date:</span> ${dueDate}
                      </div>
                      `
                          : ""
                      }
                  </div>
                  
                  <p>Please click the button below to review the document in the Document Management System:</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                      <a href="${documentUrl}" class="button">Review Document</a>
                  </div>
                  
                  <p>If you have any questions, please contact the document submitter directly.</p>
                  
                  <p>Best regards,<br>
                  <strong>Document Management System</strong></p>
              </div>
              <div class="footer">
                  <p>This is an automated notification. Please do not reply to this email.</p>
              </div>
          </div>
      </body>
      </html>
    `;
    },
    [],
  );

  const getDocumentStatusUpdateTemplate = useCallback(
    (
      documentName: string,
      status: string,
      updatedBy: string,
      comments?: string,
      documentUrl?: string,
    ): string => {
      const statusColors: { [key: string]: string } = {
        Approved: "#107c10",
        Rejected: "#d13438",
        Pending: "#ffaa44",
        "In Review": "#0078d4",
      };

      const statusColor = statusColors[status] || "#666";

      return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #faf9f8;">
        <div style="background: #0078d4; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Document Status Update</h1>
        </div>
        
        <div style="padding: 30px;">
          <p>Hello,</p>
          <p>The status of a document you're involved with has been updated:</p>
          
          <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h3 style="margin-top: 0; color: #0078d4;">${documentName}</h3>
            <div style="margin: 15px 0;">
              <strong>New Status:</strong> 
              <span style="color: ${statusColor}; font-weight: 600; margin-left: 10px;">${status}</span>
            </div>
            <div style="margin: 15px 0;">
              <strong>Updated by:</strong> ${updatedBy}
            </div>
            <div style="margin: 15px 0;">
              <strong>Updated on:</strong> ${new Date().toLocaleDateString()}
            </div>
            ${
              comments
                ? `
            <div style="margin: 15px 0;">
              <strong>Comments:</strong>
              <div style="background: #f3f2f1; padding: 10px; margin-top: 5px; border-radius: 2px;">${comments}</div>
            </div>
            `
                : ""
            }
          </div>
          
          ${
            documentUrl
              ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${documentUrl}" 
               style="display: inline-block; background: #0078d4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 600;">
              View Document
            </a>
          </div>
          `
              : ""
          }
          
          <p>Best regards,<br>
          <strong>Document Management System</strong></p>
        </div>
        
        <div style="padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e1dfdd;">
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </div>
    `;
    },
    [],
  );

  return {
    getDocumentApprovalTemplate,
    getDocumentStatusUpdateTemplate,
  };
};
