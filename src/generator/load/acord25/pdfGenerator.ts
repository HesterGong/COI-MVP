import { readFileSync } from 'fs';
import { format } from 'date-fns';
import { PDFDocument, PDFForm, StandardFonts } from 'pdf-lib';
import { isNumber } from 'lodash';

/**
 * Port from foxden-policy-document-backend/src/services/UScertificateOfInsurance/generate.ts
 *
 * UsAcordCoiGenerator — fills the ACORD 25 (2016/03) PDF template with
 * carrier-specific form config, carrier signature, and certificate holder block.
 */

interface FormConfig {
  forms: Array<{
    formName: string;
    type: 'text' | 'checkbox';
    formVariable?: string;
    formDefaultValue?: string;
    expectedValue?: string;
    isDigit?: boolean;
  }>;
}

function formatCurrencyUS(value: number): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `$${value}`;
  }
}

function localizeToDateString({
  date,
  formatStr,
  timeZone,
}: {
  date: Date;
  formatStr: string;
  timeZone?: string;
}): string {
  // Use date-fns format; for full tz support add date-fns-tz if needed
  return format(date, formatStr);
}

function setFormValueByType({
  type,
  form,
  formName,
  value,
  checked,
}: {
  type: string;
  form: PDFForm;
  formName: string;
  value?: string;
  checked?: boolean;
}): void {
  try {
    if (type === 'text' && value !== undefined) {
      form.getTextField(formName).setText(value);
    } else if (type === 'checkbox' && checked) {
      form.getCheckBox(formName).check();
    }
  } catch {
    // Silently skip missing fields — template may not have all fields
  }
}

export interface UsAcordCoiGeneratorOptions {
  pdfPath: string;
  formsConfigPath: string;
  signaturePath?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InputMap = Record<string, any>;

export class UsAcordCoiGenerator {
  private readonly pdfPath: string;
  private readonly formsConfigPath: string;
  private readonly signaturePath?: string;

  constructor({ pdfPath, formsConfigPath, signaturePath }: UsAcordCoiGeneratorOptions) {
    this.pdfPath = pdfPath;
    this.formsConfigPath = formsConfigPath;
    this.signaturePath = signaturePath;
  }

  async generateOne(input: InputMap, lob: string): Promise<{ pdfBytes: Uint8Array }> {
    const formsConfig: FormConfig = JSON.parse(readFileSync(this.formsConfigPath, 'utf-8'));
    const formList = formsConfig.forms;

    // Inject system fields (mirrors backend logic)
    const enrichedInput: InputMap = {
      ...input,
      dateNow: input.dateNow ?? new Date(),
      usEmail: input.producerEmail ?? input.usEmail ?? 'support@foxquilt.com',
      usPhoneNumber: input.producerPhone ?? input.usPhoneNumber ?? '(888) 555-0100',
    };

    const timeZone: string = enrichedInput.timeZone ?? 'America/New_York';

    // Load ACORD 25 template
    const rawPdf = readFileSync(this.pdfPath);
    const pdfDoc = await PDFDocument.load(rawPdf);
    const form = pdfDoc.getForm();

    // Fill all configured form fields
    formList
      .map(({ formName, formDefaultValue, type, formVariable, expectedValue, isDigit }) => {
        let value: string | undefined;
        let checked = false;

        if (formDefaultValue !== undefined && formDefaultValue !== null) {
          value = formDefaultValue;
          checked = expectedValue !== undefined && formDefaultValue === expectedValue;
        } else if (formVariable) {
          let rawValue = enrichedInput[formVariable];

          if (rawValue instanceof Date) {
            rawValue = localizeToDateString({
              date: rawValue,
              formatStr: 'MM-dd-yyyy',
              timeZone,
            });
          }

          if (isNumber(rawValue) && !isDigit) {
            rawValue = formatCurrencyUS(rawValue as number);
          }

          if (type === 'checkbox') {
            checked = expectedValue !== undefined && rawValue === expectedValue;
          }

          value = rawValue?.toString?.() ?? '';
        } else {
          throw new Error(
            `UScoiFormsConfig.json: neither formDefaultValue nor formVariable provided for field "${formName}"`,
          );
        }

        return { formName, type, form, value, checked };
      })
      .forEach(({ formName, type, form, value, checked }) => {
        setFormValueByType({ formName, type, form, value, checked });
      });

    // Embed carrier signature
    if (this.signaturePath) {
      try {
        const sigBytes = readFileSync(this.signaturePath);
        const embeddedSig = await pdfDoc.embedPng(sigBytes);
        try {
          form.getButton('US-Coi-signature').setImage(embeddedSig);
        } catch {
          // Signature button field may not exist in the template
        }
      } catch {
        // Signature file may be missing in dev; continue without it
      }
    }

    // Certificate holder block
    const holder = enrichedInput.certificateHolder ?? enrichedInput.additionalInsured;
    if (holder?.name && holder?.address) {
      const addr = holder.address;
      const block = `${holder.name}\n${addr.street}\n${addr.city}, ${addr.province}, ${addr.postalCode}`;
      try {
        form.getTextField('US-Coi-certificateHolder').setText(block);
      } catch {
        // Field may not be present
      }
    }

    // Flatten form field appearances for consistent rendering across PDF viewers
    try {
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      form.updateFieldAppearances(font);
    } catch {
      // Non-fatal
    }

    const pdfBytes = await pdfDoc.save();
    return { pdfBytes };
  }
}
