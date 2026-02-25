import path from 'path';
import { COIConfig } from '../../types';

const ROOT = path.resolve(__dirname, '../../..');

function t(...parts: string[]) {
  return path.join(ROOT, ...parts);
}

/**
 * Config matrix — one entry per (LOB, geography, carrierPartner) combination.
 *
 * Field mapping paths use lodash.get dot-notation against:
 *   { canonical, lob, geography, carrierPartner, timeZone }
 */
export const COI_CONFIGS: COIConfig[] = [
  // ─── US / StateNational / GL ────────────────────────────────────────────────
  {
    lob: 'GL',
    geography: 'US',
    carrierPartner: 'StateNational',
    dbCollection: 'general_liability_policies',
    templateType: 'acord25',
    templatePath: t('templates', 'acord25', 'acord_25_2016-03.pdf'),
    formsConfigPath: t('src', 'generator', 'config', 'form-configs', 'UScoiFormsConfigs-StateNational.json'),
    signaturePath: t('assets', 'signatures', 'StateNationalPresidentSignature.png'),
    emailTemplatePath: t('templates', 'email', 'us', 'emailBody.html'),
    fieldMappings: {
      insured: 'canonical.insured.block',
      certificateNumber: 'canonical.certificateNumber',
      policyNumber: 'canonical.policyNumber',
      effectiveDate: 'canonical.dates.effectiveDate',
      expirationDate: 'canonical.dates.expirationDate',
      occurrenceLimit: 'canonical.limits.occurrenceLimit',
      premisesRentedToYouLimit: 'canonical.limits.premisesRentedToYouLimit',
      medicalPaymentsLimit: 'canonical.limits.medicalPaymentsLimit',
      aggregateLimit: 'canonical.limits.aggregateLimit',
      description: 'canonical.description',
      certificateHolder: 'canonical.certificateHolder',
      carrierPartner: 'carrierPartner',
      timeZone: 'timeZone',
      producerName: 'canonical.producer.name',
      producerPhone: 'canonical.producer.phone',
      producerEmail: 'canonical.producer.email',
      lob: 'lob',
    },
  },

  // ─── US / StateNational / EO ────────────────────────────────────────────────
  {
    lob: 'EO',
    geography: 'US',
    carrierPartner: 'StateNational',
    dbCollection: 'eo_policies',
    templateType: 'acord25',
    templatePath: t('templates', 'acord25', 'acord_25_2016-03.pdf'),
    formsConfigPath: t('src', 'generator', 'config', 'form-configs', 'UScoiFormsConfigs-StateNational.json'),
    signaturePath: t('assets', 'signatures', 'StateNationalPresidentSignature.png'),
    emailTemplatePath: t('templates', 'email', 'us', 'emailBody.html'),
    fieldMappings: {
      insured: 'canonical.insured.block',
      certificateNumber: 'canonical.certificateNumber',
      policyNumber: 'canonical.policyNumber',
      effectiveDate: 'canonical.dates.effectiveDate',
      expirationDate: 'canonical.dates.expirationDate',
      occurrenceLimit: 'canonical.limits.occurrenceLimit',
      premisesRentedToYouLimit: 'canonical.limits.premisesRentedToYouLimit',
      medicalPaymentsLimit: 'canonical.limits.medicalPaymentsLimit',
      aggregateLimit: 'canonical.limits.aggregateLimit',
      description: 'canonical.description',
      certificateHolder: 'canonical.certificateHolder',
      carrierPartner: 'carrierPartner',
      timeZone: 'timeZone',
      producerName: 'canonical.producer.name',
      producerPhone: 'canonical.producer.phone',
      producerEmail: 'canonical.producer.email',
      lob: 'lob',
    },
  },

  // ─── US / Munich / GL ───────────────────────────────────────────────────────
  {
    lob: 'GL',
    geography: 'US',
    carrierPartner: 'Munich',
    dbCollection: 'general_liability_policies',
    templateType: 'acord25',
    templatePath: t('templates', 'acord25', 'acord_25_2016-03.pdf'),
    formsConfigPath: t('src', 'generator', 'config', 'form-configs', 'UScoiFormsConfigs-Munich.json'),
    signaturePath: t('assets', 'signatures', 'MunichUSSignature.png'),
    emailTemplatePath: t('templates', 'email', 'us', 'emailBody.html'),
    fieldMappings: {
      insured: 'canonical.insured.block',
      certificateNumber: 'canonical.certificateNumber',
      policyNumber: 'canonical.policyNumber',
      effectiveDate: 'canonical.dates.effectiveDate',
      expirationDate: 'canonical.dates.expirationDate',
      occurrenceLimit: 'canonical.limits.occurrenceLimit',
      premisesRentedToYouLimit: 'canonical.limits.premisesRentedToYouLimit',
      medicalPaymentsLimit: 'canonical.limits.medicalPaymentsLimit',
      aggregateLimit: 'canonical.limits.aggregateLimit',
      description: 'canonical.description',
      certificateHolder: 'canonical.certificateHolder',
      carrierPartner: 'carrierPartner',
      timeZone: 'timeZone',
      producerName: 'canonical.producer.name',
      producerPhone: 'canonical.producer.phone',
      producerEmail: 'canonical.producer.email',
      lob: 'lob',
    },
  },

  // ─── US / Munich / EO ───────────────────────────────────────────────────────
  {
    lob: 'EO',
    geography: 'US',
    carrierPartner: 'Munich',
    dbCollection: 'eo_policies',
    templateType: 'acord25',
    templatePath: t('templates', 'acord25', 'acord_25_2016-03.pdf'),
    formsConfigPath: t('src', 'generator', 'config', 'form-configs', 'UScoiFormsConfigs-Munich.json'),
    signaturePath: t('assets', 'signatures', 'MunichUSSignature.png'),
    emailTemplatePath: t('templates', 'email', 'us', 'emailBody.html'),
    fieldMappings: {
      insured: 'canonical.insured.block',
      certificateNumber: 'canonical.certificateNumber',
      policyNumber: 'canonical.policyNumber',
      effectiveDate: 'canonical.dates.effectiveDate',
      expirationDate: 'canonical.dates.expirationDate',
      occurrenceLimit: 'canonical.limits.occurrenceLimit',
      premisesRentedToYouLimit: 'canonical.limits.premisesRentedToYouLimit',
      medicalPaymentsLimit: 'canonical.limits.medicalPaymentsLimit',
      aggregateLimit: 'canonical.limits.aggregateLimit',
      description: 'canonical.description',
      certificateHolder: 'canonical.certificateHolder',
      carrierPartner: 'carrierPartner',
      timeZone: 'timeZone',
      producerName: 'canonical.producer.name',
      producerPhone: 'canonical.producer.phone',
      producerEmail: 'canonical.producer.email',
      lob: 'lob',
    },
  },

  // ─── CA / Foxquilt / GL ─────────────────────────────────────────────────────
  {
    lob: 'GL',
    geography: 'CA',
    carrierPartner: 'Foxquilt',
    dbCollection: 'general_liability_policies',
    templateType: 'html-handlebars',
    templatePath: t('templates', 'html', 'template.handlebars'),
    emailTemplatePath: t('templates', 'email', 'ca', 'emailBody.html'),
    fieldMappings: {
      policyFoxdenId: 'canonical.policyNumber',
      insuranceCompany: 'canonical.insurer.name',
      namedInsured: 'canonical.insured',
      additionalInsured: 'canonical.additionalInsured',
      effectiveDate: 'canonical.dates.effectiveDate',
      expiryDate: 'canonical.dates.expirationDate',
      coverages: 'canonical.coverages',
      descriptionOfOperations: 'canonical.description',
      dateNow: 'now',
      timeZone: 'timeZone',
    },
  },

  // ─── CA / Greenlight / GL ───────────────────────────────────────────────────
  // Greenlight uses same CA Handlebars template; insurer is still Lloyd's.
  {
    lob: 'GL',
    geography: 'CA',
    carrierPartner: 'Greenlight',
    dbCollection: 'general_liability_policies',
    templateType: 'html-handlebars',
    templatePath: t('templates', 'html', 'template.handlebars'),
    emailTemplatePath: t('templates', 'email', 'ca', 'emailBody.html'),
    fieldMappings: {
      policyFoxdenId: 'canonical.policyNumber',
      insuranceCompany: 'canonical.insurer.name',
      namedInsured: 'canonical.insured',
      additionalInsured: 'canonical.additionalInsured',
      effectiveDate: 'canonical.dates.effectiveDate',
      expiryDate: 'canonical.dates.expirationDate',
      coverages: 'canonical.coverages',
      descriptionOfOperations: 'canonical.description',
      dateNow: 'now',
      timeZone: 'timeZone',
    },
  },
];

/**
 * Find config with exact match first (lob + geography + carrierPartner).
 * Falls back to any config matching (lob + geography) if no carrier-specific entry.
 */
export function findConfig(params: {
  lob: string;
  geography: 'US' | 'CA';
  carrierPartner: string;
}): COIConfig | undefined {
  const { lob, geography, carrierPartner } = params;
  return (
    COI_CONFIGS.find(
      (c) => c.lob === lob && c.geography === geography && c.carrierPartner === carrierPartner,
    ) ??
    COI_CONFIGS.find(
      (c) => c.lob === lob && c.geography === geography,
    )
  );
}

/** Check whether a config exists for this combination without throwing */
export function hasConfig(params: {
  lob: string;
  geography: 'US' | 'CA';
  carrierPartner: string;
}): boolean {
  return findConfig(params) !== undefined;
}
