import fs from 'node:fs';
import path from 'node:path';
import Handlebars from 'handlebars';
import html2pdf from '../../utils/html2pdf.mjs';
import {
  formatCurrencyCAD,
  formatDateCA,
  toLongProvinceName
} from './helpers.mjs';

/**
 * Render Canada COI via Handlebars + Browserless
 */
export async function renderCanadaHtml({
  templatePath,
  fields,
  timeZone,
  browserlessToken
}) {
  // 1. Load template
  const templateSource = fs.readFileSync(
    path.resolve(templatePath),
    'utf-8'
  );

  // 2. Register helpers
  Handlebars.registerHelper('formatCurrency', formatCurrencyCAD);
  Handlebars.registerHelper('formatDate', (date) =>
    formatDateCA(date, timeZone)
  );
  Handlebars.registerHelper('toLongProvinceName', toLongProvinceName);

  // 3. Compile HTML
  const compile = Handlebars.compile(templateSource);
  const html = compile(fields);

  // 4. HTML → PDF
  return html2pdf({
    html,
    browserlessToken
  });
}
