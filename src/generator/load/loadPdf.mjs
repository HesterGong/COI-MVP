import path from 'node:path';

import { renderCanadaHtml } from './html/htmlGenerator.mjs';
import { UsAcordCoiGenerator } from './acord25/pdfGenerator.mjs';

export async function loadPdf(config, mappedFields) {
  // US: ACORD 25 PDF form-fill
  if (config.templateType === 'acord25') {
    const us = new UsAcordCoiGenerator({
      pdfPath: config.templatePath,
      formsConfigPath: config.formsConfigPath,
      strict: config.strictPdfFields ?? true
    });

    // mappedFields is the "input" object for the US form-fill logic
    const { pdfBytes } = await us.generateOne(mappedFields, mappedFields.lob);
    return pdfBytes;
  }

  // CA: Handlebars HTML -> PDF (Browserless)
  if (config.templateType === 'html-handlebars') {
    const pdfBuffer = await renderCanadaHtml({
      templatePath: config.templatePath, // e.g. ./src/templates/canada-html/template.handlebars
      fields: mappedFields,
      timeZone: mappedFields.timeZone ?? 'America/Toronto',
      browserlessToken:
        mappedFields.browserlessToken ??
        process.env.BROWSERLESS_API_TOKEN ??
        process.env.BROWSERLESS_TOKEN ?? '1SJmKGVt1es7k3e88a7f10afd76f2720ed4079a2316ea05b1' 
    });

    // keep return type consistent with US (Uint8Array / Buffer is fine)
    return pdfBuffer;
  }

  throw new Error(
    `[loadPdf] Unsupported templateType "${config.templateType}". Expected "acord25" or "html-handlebars".`
  );
}
