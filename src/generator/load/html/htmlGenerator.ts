import { readFileSync } from 'fs';
import Handlebars from 'handlebars';
import { formatCurrencyCAD, formatDateCA, toLongProvinceName } from './helpers';
import html2pdf from '../utils/html2pdf';

/**
 * Port from foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts
 *
 * Renders the Canada COI using Handlebars + Browserless HTML→PDF.
 */
export async function renderCanadaHtml({
  templatePath,
  fields,
  timeZone,
  browserlessToken,
}: {
  templatePath: string;
  fields: Record<string, unknown>;
  timeZone: string;
  browserlessToken: string;
}): Promise<Buffer> {
  // Load template from disk
  const templateSource = readFileSync(templatePath, 'utf-8');

  // Compile with helpers
  const compiled = Handlebars.compile(templateSource);

  const html = compiled(fields, {
    helpers: {
      formatCurrency(val: unknown) {
        return formatCurrencyCAD(val);
      },
      formatDate(val: unknown) {
        return formatDateCA(val, timeZone);
      },
      toLongProvinceName(val: unknown) {
        return toLongProvinceName(val);
      },
    },
  });

  // HTML → PDF via Browserless
  return html2pdf({ html, browserlessToken });
}
