import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD, // App Password từ Google
  },
});

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  try {
    await transporter.sendMail({
      from: `"Jira Lite" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error: "Failed to send email" };
  }
}

export function getInviteEmailTemplate(teamName: string, inviteLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-radius: 12px; padding: 40px;">
            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 24px; font-weight: bold; line-height: 48px;">J</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0; font-size: 24px; color: #18181b;">You're invited!</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
              <tr>
                <td>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    You've been invited to join <strong style="color: #18181b;">${teamName}</strong> on Jira Lite.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <a href="${inviteLink}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Accept Invitation
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">
                    Or copy this link:
                  </p>
                  <p style="background: #f4f4f5; padding: 12px; border-radius: 6px; font-size: 12px; word-break: break-all; color: #52525b; margin: 0;">
                    ${inviteLink}
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    This invitation expires in 7 days.<br>
                    If you didn't expect this email, you can ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getConfirmEmailTemplate(name: string, confirmLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-radius: 12px; padding: 40px;">
            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 24px; font-weight: bold; line-height: 48px;">J</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0; font-size: 24px; color: #18181b;">Welcome to Jira Lite!</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
              <tr>
                <td>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi <strong style="color: #18181b;">${name}</strong>,<br><br>
                    Thanks for signing up! Please confirm your email address to get started.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <a href="${confirmLink}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Confirm Email
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">
                    Or copy this link:
                  </p>
                  <p style="background: #f4f4f5; padding: 12px; border-radius: 6px; font-size: 12px; word-break: break-all; color: #52525b; margin: 0;">
                    ${confirmLink}
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    This link expires in 24 hours.<br>
                    If you didn't create an account, you can ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getPasswordResetEmailTemplate(confirmLink: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-radius: 12px; padding: 40px;">
            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 24px; font-weight: bold; line-height: 48px;">J</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0; font-size: 24px; color: #18181b;">Reset Your Password</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
              <tr>
                <td>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    We received a request to reset your password. Click the button below to create a new password.
                  </p>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <a href="${confirmLink}" style="display: inline-block; background: #3b82f6; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Reset Password
                  </a>
                </td>
              </tr>
              <tr>
                <td>
                  <p style="color: #a1a1aa; font-size: 14px; margin: 0 0 8px 0;">
                    Or copy this link:
                  </p>
                  <p style="background: #f4f4f5; padding: 12px; border-radius: 6px; font-size: 12px; word-break: break-all; color: #52525b; margin: 0;">
                    ${confirmLink}
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    This link expires in 1 hour.<br>
                    If you didn't request a password reset, you can ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getRemovedFromTeamEmailTemplate(
  memberName: string,
  teamName: string,
  removedByName: string,
  removedByRole: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-radius: 12px; padding: 40px;">
            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #ef4444, #dc2626); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-size: 24px; font-weight: bold; line-height: 48px;">J</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0; font-size: 24px; color: #18181b;">You've been removed from a team</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
              <tr>
                <td>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi <strong style="color: #18181b;">${memberName}</strong>,<br><br>
                    You have been removed from the team <strong style="color: #18181b;">${teamName}</strong>.
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #fef2f2; border-radius: 8px; padding: 16px; border-left: 4px solid #ef4444;">
                    <tr>
                      <td>
                        <p style="color: #991b1b; font-size: 14px; margin: 0;">
                          <strong>Removed by:</strong> ${removedByName} (${removedByRole})
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 24px;">
                  <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0;">
                    You will no longer have access to the team's projects and issues. If you believe this was a mistake, please contact the team administrator.
                  </p>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    This is an automated notification from Jira Lite.<br>
                    If you have questions, please contact the team owner.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getOwnershipTransferEmailTemplate(
  newOwnerName: string,
  teamName: string,
  previousOwnerName: string
) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-radius: 12px; padding: 40px;">
            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-weight: bold; font-size: 20px;">J</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0; font-size: 24px; color: #18181b;">🎉 You're now the Team Owner!</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
              <tr>
                <td>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi <strong style="color: #18181b;">${newOwnerName}</strong>,<br><br>
                    Congratulations! You have been promoted to <strong style="color: #3b82f6;">Team Owner</strong> of <strong style="color: #18181b;">${teamName}</strong>.
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0fdf4; border-radius: 8px; padding: 16px; border-left: 4px solid #22c55e;">
                    <tr>
                      <td>
                        <p style="color: #166534; font-size: 14px; margin: 0;">
                          <strong>Transferred by:</strong> ${previousOwnerName}<br>
                          <strong>Your new role:</strong> OWNER
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding-top: 24px;">
                  <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
                    As the team owner, you now have full control over the team including:
                  </p>
                  <ul style="color: #52525b; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                    <li>Manage all team members and their roles</li>
                    <li>Delete or transfer the team</li>
                    <li>Full access to all projects and settings</li>
                  </ul>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    This is an automated notification from Jira Lite.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function getRoleChangedEmailTemplate(
  memberName: string,
  teamName: string,
  oldRole: string,
  newRole: string,
  changedByName: string
) {
  const isPromotion = newRole === "ADMIN" && oldRole === "MEMBER";
  const bgColor = isPromotion ? "#f0fdf4" : "#fef3c7";
  const borderColor = isPromotion ? "#22c55e" : "#f59e0b";
  const textColor = isPromotion ? "#166534" : "#92400e";
  const emoji = isPromotion ? "⬆️" : "⬇️";
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f4f4f5; padding: 40px 20px; margin: 0;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin: 0 auto;">
        <tr>
          <td style="background: white; border-radius: 12px; padding: 40px;">
            <!-- Logo -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom: 24px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6, #6366f1); width: 48px; height: 48px; border-radius: 12px; text-align: center; vertical-align: middle;">
                        <span style="color: white; font-weight: bold; font-size: 20px;">J</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center">
                  <h1 style="margin: 0; font-size: 24px; color: #18181b;">${emoji} Your role has changed</h1>
                </td>
              </tr>
            </table>
            
            <!-- Content -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px;">
              <tr>
                <td>
                  <p style="color: #52525b; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi <strong style="color: #18181b;">${memberName}</strong>,<br><br>
                    Your role in <strong style="color: #18181b;">${teamName}</strong> has been updated.
                  </p>
                </td>
              </tr>
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: ${bgColor}; border-radius: 8px; padding: 16px; border-left: 4px solid ${borderColor};">
                    <tr>
                      <td>
                        <p style="color: ${textColor}; font-size: 14px; margin: 0;">
                          <strong>Previous role:</strong> ${oldRole}<br>
                          <strong>New role:</strong> ${newRole}<br>
                          <strong>Changed by:</strong> ${changedByName}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
            
            <!-- Footer -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 32px; border-top: 1px solid #e4e4e7; padding-top: 24px;">
              <tr>
                <td align="center">
                  <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                    This is an automated notification from Jira Lite.<br>
                    If you have questions, please contact the team owner.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

