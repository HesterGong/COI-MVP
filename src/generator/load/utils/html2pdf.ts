import fetch from 'node-fetch';

/**
 * Port from coi-mvp-etl/src/generator/load/utils/html2pdf.mjs
 *
 * Convert HTML → PDF via Browserless API (https://chrome.browserless.io/pdf).
 * A4 format, 0.5in top/bottom margins, printBackground enabled.
 */
export default async function html2pdf({
  html,
  browserlessToken,
}: {
  html: string;
  browserlessToken: string;
}): Promise<Buffer> {
  const res = await fetch(
    `https://chrome.browserless.io/pdf?token=${browserlessToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        options: {
          format: 'A4',
          printBackground: true,
          margin: {
            top: '0.5in',
            bottom: '0.5in',
          },
        },
      }),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Browserless PDF failed [${res.status}]: ${text}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}
