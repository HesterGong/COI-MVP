import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

export class CoiFinalizer {
  /**
   * @param {{ expectedLobs: string[] }} args
   */
  constructor({ expectedLobs }) {
    this.expectedLobs = expectedLobs;
    /** @type {Map<string, Map<string, Uint8Array>>} correlationId -> (lob -> pdfBytes) */
    this.buffers = new Map();
  }

  /**
   * @param {{ correlationId: string, lob: string, pdfBytes: Uint8Array }} evt
   */
  async onLobDone({ correlationId, lob, pdfBytes }) {
    if (!this.buffers.has(correlationId)) this.buffers.set(correlationId, new Map());
    this.buffers.get(correlationId).set(lob, pdfBytes);

    if (!this._allDone(correlationId)) return;

    const merged = await this._merge(correlationId);
    await fs.mkdir('out', { recursive: true });
    const outPath = path.join('out', `COI_${correlationId}.pdf`);
    await fs.writeFile(outPath, Buffer.from(merged));

    // MVP “email”
    console.log(`EMAIL SENT (log only): ${outPath}`);
  }

  _allDone(correlationId) {
    const m = this.buffers.get(correlationId);
    if (!m) return false;
    return this.expectedLobs.every((lob) => m.has(lob));
  }

  async _merge(correlationId) {
    const m = this.buffers.get(correlationId);
    const merged = await PDFDocument.create();
    for (const lob of this.expectedLobs) {
      const bytes = m.get(lob);
      const doc = await PDFDocument.load(bytes);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      pages.forEach((p) => merged.addPage(p));
    }
    return merged.save();
  }
}
