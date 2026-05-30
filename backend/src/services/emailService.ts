import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');

const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const appName = 'Organization Management';

const baseHtml = (content: string) => `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
      <tr>
        <td align="center" style="padding:40px 20px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:24px;letter-spacing:1px;">${appName}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:40px;">
                ${content}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f8fafc;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  ${appName} &mdash; Manage your organization efficiently.
                </p>
                <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;">
                  If you did not request this email, please ignore it.
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

export const sendOtpEmail = async (to: string, otpCode: string, name: string) => {
  console.log(`[DEV] OTP for ${to}: ${otpCode}`);

  const html = baseHtml(`
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 8px;">Welcome, ${name}!</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      Thank you for registering. Use the verification code below to complete your account setup.
    </p>
    <div style="background:#f1f5f9;border-radius:10px;padding:20px;text-align:center;margin-bottom:24px;">
      <span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#1e293b;font-family:monospace;">${otpCode}</span>
    </div>
    <p style="color:#64748b;font-size:13px;margin:0 0 4px;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not create an account, no further action is needed.</p>
  `);

  await resend.emails.send({
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: 'Your Registration OTP Code',
    html,
  });
  console.log(`OTP email sent to ${to}`);
};

export const sendResetPasswordEmail = async (to: string, token: string, name: string) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(to)}`;
  console.log(`[DEV] Password reset link for ${to}: ${resetLink}`);

  const html = baseHtml(`
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 8px;">Hello ${name},</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
      We received a request to reset your password. Click the button below to choose a new one.
    </p>
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">Reset Password</a>
    </div>
    <p style="color:#64748b;font-size:13px;margin:0 0 4px;">This link expires in <strong>1 hour</strong>.</p>
    <p style="color:#94a3b8;font-size:12px;margin:0;">If you did not request a password reset, please ignore this email.</p>
  `);

  await resend.emails.send({
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject: 'Password Reset Request',
    html,
  });
  console.log(`Password reset email sent to ${to}`);
};

export const sendNotificationEmail = async (
  to: string,
  subject: string,
  message: string,
  name: string,
) => {
  const html = baseHtml(`
    <h2 style="color:#1e293b;font-size:22px;margin:0 0 8px;">Hi ${name},</h2>
    <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">${message}</p>
    <p style="color:#94a3b8;font-size:12px;margin:0;">This is an automated notification from ${appName}.</p>
  `);

  await resend.emails.send({
    from: `"${appName}" <${fromEmail}>`,
    to,
    subject,
    html,
  });
  console.log(`Notification email sent to ${to}: ${subject}`);
};
