import fetch from 'node-fetch';

/**
 * Convert HTML → PDF via Browserless
 */
export default async function html2pdf({
  html,
  browserlessToken
}) {
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
            bottom: '0.5in'
          }
        }
      })
    }
  );

  if (!res.ok) {
    throw new Error(`Browserless PDF failed: ${res.status}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  return buffer;
}
