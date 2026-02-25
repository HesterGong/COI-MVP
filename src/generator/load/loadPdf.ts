import { COIConfig, Logger } from '../../types';
import { UsAcordCoiGenerator } from './acord25/pdfGenerator';
import { renderCanadaHtml } from './html/htmlGenerator';
import { sendEmail } from './email/sendEmail';

/**
 * Load phase: render PDF (ACORD 25 or HTML→PDF) then send email with attachment.
 *
 * Load order (per design doc): render → sendEmail
 * (saveToS3 is Story 9, added after sendEmail)
 */
export async function loadPdf(
  config: COIConfig,
  mapped: Record<string, unknown>,
  opts: {
    recipientEmail: string;
    geography: 'US' | 'CA';
    policyFoxdenId: string;
    lob: string;
    browserlessToken?: string;
    logger: Logger;
  },
): Promise<Uint8Array | Buffer> {
  const { recipientEmail, geography, lob, browserlessToken, logger } = opts;

  let pdfBytes: Uint8Array | Buffer;

  // ─── Render PDF ──────────────────────────────────────────────────────────────
  if (config.templateType === 'acord25') {
    logger.debug('loadPdf: using ACORD 25 renderer', { lob });

    const generator = new UsAcordCoiGenerator({
      pdfPath: config.templatePath,
      formsConfigPath: config.formsConfigPath!,
      signaturePath: config.signaturePath,
    });

    const result = await generator.generateOne(mapped as Record<string, unknown>, lob);
    pdfBytes = result.pdfBytes;
  } else if (config.templateType === 'html-handlebars') {
    logger.debug('loadPdf: using HTML-Handlebars renderer', { lob });

    if (!browserlessToken) {
      throw new Error('BROWSERLESS_API_TOKEN is required for Canada (html-handlebars) COI generation');
    }

    pdfBytes = await renderCanadaHtml({
      templatePath: config.templatePath,
      fields: mapped,
      timeZone: (mapped.timeZone as string) ?? 'America/Toronto',
      browserlessToken,
    });
  } else {
    throw new Error(`loadPdf: unsupported templateType "${config.templateType}"`);
  }

  logger.debug('loadPdf: PDF rendered successfully', { lob, bytes: pdfBytes.length });

  // ─── Send email ──────────────────────────────────────────────────────────────
  await sendEmail({
    pdfBytes: Buffer.isBuffer(pdfBytes) ? pdfBytes : Buffer.from(pdfBytes),
    recipientEmail,
    geography,
    emailTemplatePath: config.emailTemplatePath,
    logger,
  });

  return pdfBytes;
}
