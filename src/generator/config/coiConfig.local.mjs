// src/configs/coi-configs.mjs (or wherever you keep it)

export const COI_CONFIGS = [
  // ----------------------------
  // US (ACORD 25 PDF fill) - GL
  // ----------------------------
  {
    lob: 'GL',
    geography: 'US',
    carrierPartner: 'StateNational',
    dbCollection: 'general_liability_policies',
    templateType: 'acord25',
    templatePath: './templates/acord25/acord_25_2016-03.pdf',

    // optional (US only): choose the forms config file (StateNational vs Munich)
    formsConfigPath: './src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json',

    fieldMappings: {
      insured: 'canonical.insured.block',
      certificateNumber: 'canonical.certificateNumber',
      policyNumber: 'canonical.policyNumber',

      // IMPORTANT: template PDF field list you printed uses policyEffective/policyExpire,
      // so map canonical dates into those names in your US generator (or keep these and
      // transform inside us-acord.mjs).
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

      lob: 'lob'
    }
  },

  // ----------------------------
  // US (ACORD 25 PDF fill) - EO
  // ----------------------------
  {
    lob: 'EO',
    geography: 'US',
    carrierPartner: 'StateNational',
    dbCollection: 'eo_policies',
    templateType: 'acord25',
    templatePath: './templates/acord25/acord_25_2016-03.pdf',
    formsConfigPath: './src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json',

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

      lob: 'lob'
    }
  },

  // ----------------------------
  // CA (Handlebars -> HTML -> PDF) - GL
  // ----------------------------
  {
    lob: 'GL',
    geography: 'CA',
    carrierPartner: 'Foxquilt',

    // CA still needs data, so you must point extract to a fixture collection
    // (or your extract step will have nothing to load).
    dbCollection: 'general_liability_policies',

    templateType: 'html-handlebars',
    templatePath: './templates/html/template.handlebars',

    fieldMappings: {
      // for Canada template, policyFoxdenId is used as "policy number" display in HTML
      policyFoxdenId: 'canonical.policyNumber',
      insuranceCompany: 'canonical.insurer.name',

      namedInsured: 'canonical.insured',
      additionalInsured: 'canonical.additionalInsured',

      effectiveDate: 'canonical.dates.effectiveDate',
      expiryDate: 'canonical.dates.expirationDate',

      coverages: 'canonical.coverages',
      descriptionOfOperations: 'canonical.description',

      carrierPartner: 'carrierPartner',
      timeZone: 'timeZone',

      lob: 'lob'
    }
  }
];

/**
 * Prefer exact match first.
 * Then fall back to (lob+geography) default if carrierPartner-specific config is absent.
 */
export function findConfig({ lob, geography, carrierPartner }) {
  return (
    COI_CONFIGS.find(
      (c) =>
        c.lob === lob &&
        c.geography === geography &&
        (c.carrierPartner ?? carrierPartner) === carrierPartner
    ) ??
    COI_CONFIGS.find((c) => c.lob === lob && c.geography === geography && !c.carrierPartner)
  );
}
