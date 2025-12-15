import path from 'node:path';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { format } from 'date-fns';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadJson(relPath) {
  return JSON.parse(readFileSync(join(__dirname, relPath), 'utf-8'));
}

const UScoiFormsConfigsMunich = loadJson('../form-configs/UScoiFormsConfigs-Munich.json');
const UScoiFormsConfigsStateNational = loadJson('../form-configs/UScoiFormsConfigs-StateNational.json');

function debugListPdfFields(form) {
  const names = form.getFields().map(f => f.getName());
  names.sort((a, b) => a.localeCompare(b));
  console.log(`\nPDF has ${names.length} fields:\n`);
  for (const n of names) console.log(n);
  console.log('\n---\n');
}

function formatCurrency(value) {
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  } catch {
    return `$${value}`;
  }
}

function toDateMaybe(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  // support ISO strings / timestamps from fixtures
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function localizeToDateString({ date, formatStr }) {
  // MVP: ignore timezone. Production: apply tz conversion.
  return format(date, formatStr);
}

function safeGetTextField(form, name) {
  try {
    return form.getTextField(name);
  } catch {
    return null;
  }
}

function safeGetCheckBox(form, name) {
  try {
    return form.getCheckBox(name);
  } catch {
    return null;
  }
}

function safeGetButton(form, name) {
  try {
    return form.getButton(name);
  } catch {
    return null;
  }
}

function setFormValueByType({ type, form, formName, value, checked }) {
  if (type === 'text') {
    const tf = safeGetTextField(form, formName);
    if (tf) tf.setText(value ?? '');
    return;
  }

  if (type === 'checkbox') {
    const cb = safeGetCheckBox(form, formName);
    if (cb && checked) cb.check();
    return;
  }
}

function buildCertificateHolderBlock(holder) {
  if (!holder?.name || !holder?.address) return null;
  const a = holder.address;
  return `${holder.name}\n${a.street}\n${a.city}, ${a.province}, ${a.postalCode}`;
}

export class UsAcordCoiGenerator {
  constructor({ pdfPath, strict = true }) {
    this.pdfPath = pdfPath;
    this.strict = strict; // if true: crash when config references missing PDF field
  }

  async generateOne(input, lob) {
    // Mirror old logic: inject system fields before mapping.
    const enrichedInput = {
      ...input,
      dateNow: input?.dateNow ?? new Date(),
      usEmail: input?.usEmail ?? 'support@foxquilt.com',
      usPhoneNumber: input?.usPhoneNumber ?? '(888) 555-0100'
    };

    const rawPdf = readFileSync(this.pdfPath);
    const pdfDoc = await PDFDocument.load(rawPdf);
    const form = pdfDoc.getForm();
    debugListPdfFields(form);

    const carrierPartner = enrichedInput.carrierPartner ?? 'StateNational';
    const timeZone = enrichedInput.timeZone ?? 'America/New_York';

    const formList =
      carrierPartner === 'StateNational'
        ? UScoiFormsConfigsStateNational.forms
        : UScoiFormsConfigsMunich.forms;

    // Optional strict validation: surface mismatched PDF field names immediately
    if (this.strict) {
      const existing = new Set(form.getFields().map(f => f.getName()));
      for (const f of formList) {
        if (!existing.has(f.formName)) {
          throw new Error(`[US ACORD] Missing field in template PDF: ${f.formName}`);
        }
      }
      // also validate the hardcoded special fields if present
      if (!existing.has('US-Coi-certificateHolder')) {
        // don’t throw: some templates might not include it; your code can still run
        // but you probably want it in your real template
      }
      if (!existing.has('US-Coi-signature')) {
        // same
      }
    }

    // Fill configured fields
    formList
      .map(({ formName, formDefaultValue, type, formVariable, expectedValue, isDigit }) => {
        let value;
        let checked = false;

        if (formDefaultValue !== undefined && formDefaultValue !== null) {
          value = formDefaultValue;
          checked = expectedValue !== undefined && formDefaultValue === expectedValue;
        } else if (formVariable) {
          value = enrichedInput[formVariable];

          const d = toDateMaybe(value);
          if (d) {
            value = localizeToDateString({
              date: d,
              formatStr: 'MM-dd-yyyy',
              timeZone
            });
          }

          if (typeof value === 'number' && !isDigit) {
            value = formatCurrency(value);
          }

          if (type === 'checkbox') {
            checked = expectedValue !== undefined && value === expectedValue;
          }
        } else {
          throw new Error(
            'US COI form config provided neither default value nor formVariable for input ' + formName
          );
        }

        return {
          formName,
          type,
          form,
          value: value?.toString?.() ?? '',
          checked
        };
      })
      .forEach(({ formName, type, form, value, checked }) => {
        setFormValueByType({ formName, type, form, value, checked });
      });

    // Signature image (single placeholder in MVP)
    const signaturePath = path.resolve('assets/signatures/signature.png');
    try {
      const sigBytes = readFileSync(signaturePath);
      const embedded = await pdfDoc.embedPng(sigBytes);
      const btn = safeGetButton(form, 'US-Coi-signature');
      if (btn) btn.setImage(embedded);
    } catch {
      // ignore in MVP
    }

    // Certificate holder block (matches old code behavior)
    try {
      const holder = enrichedInput.certificateHolder ?? enrichedInput.additionalInsured ?? null;
      const block = buildCertificateHolderBlock(holder);
      if (block) {
        const tf = safeGetTextField(form, 'US-Coi-certificateHolder');
        if (tf) tf.setText(block);
      }
    } catch {
      // ignore
    }

    // IMPORTANT: update appearances so text shows reliably across viewers
    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
    } catch {
      // ignore
    }

    const pdfBytes = await pdfDoc.save();
    return { pdfBytes };
  }
}
