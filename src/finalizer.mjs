import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFDocument } from 'pdf-lib';

export class CoiFinalizer {
  /**
   * @param {{ expectedLobs: string[] }} args
   */
  constructor({ expectedLobs }) {
    this.expectedLobs = expectedLobs;
    /** @type {Map<string, Map<string, Uint8Array>>} workflowId -> (lob -> pdfBytes) */
    this.buffers = new Map();
  }

  /**
   * @param {{ workflowId: string, lob: string, pdfBytes: Uint8Array }} evt
   */
  async onLobDone({ workflowId, lob, pdfBytes }) {
    if (!this.buffers.has(workflowId)) this.buffers.set(workflowId, new Map());
    this.buffers.get(workflowId).set(lob, pdfBytes);

    if (!this._allDone(workflowId)) return;

    const merged = await this._merge(workflowId);
    await fs.mkdir('out', { recursive: true });
    const outPath = path.join('out', `COI_${workflowId}.pdf`);
    await fs.writeFile(outPath, Buffer.from(merged));

    // MVP “email”
    console.log(`EMAIL SENT (log only): ${outPath}`);
  }

  _allDone(workflowId) {
    const m = this.buffers.get(workflowId);
    if (!m) return false;
    return this.expectedLobs.every((lob) => m.has(lob));
  }

  async _merge(workflowId) {
    const m = this.buffers.get(workflowId);
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
