import { readFileSync } from 'fs';
import nodemailer from 'nodemailer';
import { createTransport } from '@foxden/shared-lib';
import { Logger } from '../../../types';

/**
 * Unified email sender for both CA and US COI PDFs.
 *
 * Uses createTransport from @foxden/shared-lib — same as foxden-policy-document-backend.
 * Mode is controlled by the STAGE env var:
 *
 * LOCAL (STAGE=local): Ethereal test account — actually sends but only to Ethereal inbox.
 *                      Preview URL is logged so you can inspect the rendered email.
 * DEV   (STAGE=dev):   Same as local — Ethereal, safe for testing against real dev data.
 * PROD  (STAGE=prod):  AWS SES — real delivery.
 */

function getEmailBody(emailTemplatePath: string): string {
  try {
    return readFileSync(emailTemplatePath, 'utf-8');
  } catch {
    return `
      <h1>Good day.</h1>
      <p>Please find attached a Certificate of Insurance that was requested by your company.</p>
      <p>Thanks again for choosing Foxquilt!</p>
      <p style="color: #46b2bb">- The Foxquilt Team</p>
    `;
  }
}

export async function sendEmail({
  pdfBytes,
  recipientEmail,
  geography,
  emailTemplatePath,
  logger,
}: {
  pdfBytes: Buffer;
  recipientEmail: string;
  geography: 'US' | 'CA';
  emailTemplatePath: string;
  logger: Logger;
}): Promise<void> {
  const stage = process.env.STAGE ?? 'local';
  // local and dev use Ethereal (no real delivery); prod uses AWS SES
  const testMode = stage !== 'prod';

  const from = process.env.EMAIL_SENDER ?? 'noreply@foxquilt.com';
  const supportEmail = process.env.SUPPORT_EMAIL ?? 'support@foxquilt.com';
  const bcc3 = process.env.EMAIL_BCC3;
  const bcc = [supportEmail, bcc3].filter(Boolean) as string[];

  const htmlBody = getEmailBody(emailTemplatePath);

  const mailOptions = {
    from,
    to: [recipientEmail],
    bcc,
    subject: 'Foxquilt Insurance - Certificate of Insurance',
    html: htmlBody,
    attachments: [
      {
        filename: 'certificate-of-insurance.pdf',
        content: pdfBytes,
      },
    ],
  };

  // createTransport from shared-lib: testMode=true → Ethereal SMTP; false → AWS SES
  const transporter = await createTransport({ logger: logger as any, testMode });
  const info = await transporter.sendMail(mailOptions);

  if (testMode) {
    logger.info('sendEmail [test]: Ethereal preview (not delivered to recipient)', {
      previewUrl: nodemailer.getTestMessageUrl(info),
      to: mailOptions.to,
      bcc: mailOptions.bcc,
      attachmentSize: pdfBytes.length,
      geography,
      stage,
    });
  } else {
    logger.debug('sendEmail: sent via AWS SES', {
      messageId: (info as any).messageId,
      recipientEmail,
      geography,
    });
  }
}
