import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

export class CoiFinalizer {
  /**
   * @param {{ expectedLobs: string[] }} args
   */
  constructor({ expectedLobs }) {
    this.expectedLobs = expectedLobs;
    /** @type {Map<string, Map<string, Uint8Array>>} applicationId -> (lob -> pdfBytes) */
    this.buffers = new Map();
  }

  /**
   * @param {{ applicationId: string, lob: string, pdfBytes: Uint8Array }} evt
   */
  async onLobDone({ applicationId, lob, pdfBytes }) {
    console.log(`Finalizer received LOB done: ${applicationId} / ${lob}`);
    if (!this.buffers.has(applicationId)) this.buffers.set(applicationId, new Map());
    this.buffers.get(applicationId).set(lob, pdfBytes);

    if (!this._allDone(applicationId)) return;

    const merged = await this._merge(applicationId);
    await fs.mkdir('out', { recursive: true });
    const outPath = path.join('out', `COI_${applicationId}.pdf`);
    await fs.writeFile(outPath, Buffer.from(merged));

    // MVP “email”
    console.log(`EMAIL SENT (log only): ${outPath}`);
  }

  _allDone(applicationId) {
    const m = this.buffers.get(applicationId);
    if (!m) return false;
    return this.expectedLobs.every((lob) => m.has(lob));
  }

  async _merge(applicationId) {
    const m = this.buffers.get(applicationId);
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
