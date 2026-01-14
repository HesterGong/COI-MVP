function addressLine(a) {
  if (!a) return '';
  const parts = [a.street, a.city, a.province, a.postalCode].filter(Boolean);
  return parts.join(', ');
}

function insuredBlock(namedInsured, a) {
  if (!namedInsured || !a) return '';
  return `${namedInsured}\n${a.street}\n${a.city}, ${a.province}, ${a.postalCode}`;
}

/**
 * Apply data-driven transforms (optional).
 * In production these could be sandboxed JS functions loaded by config.
 */
export async function applyTransforms(raw, transforms) {
  let result = raw;
  for (const fn of transforms ?? []) {
    result = await fn(result);
  }
  return result;
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function pickLimit(obj, keys) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return undefined;
}

/**
 * Build a canonical COI model (normalized input for mapping/rendering).
 *
 * Goal:
 * - Canonical should contain everything needed to build "UsCoiInput-like" mapped fields.
 * - No PDF logic here.
 */
export async function buildCanonical({ transformed, lob, geography, additionalInsured }) {
  const { policy, coverages, quote } = transformed;

  const coverageSummary = (coverages ?? [])
    .map((c) => `${c.name}: ${c.limit} (deductible ${c.deductible})`)
    .join(' | ');

  const certificateHolder = additionalInsured
    ? { name: additionalInsured.name, address: additionalInsured.address }
    : { name: '', address: null };

  // Normalize insured + producer shapes
  const insuredName =
    policy?.insured?.name ??
    policy?.insuredName ??
    policy?.businessName ??
    '';

  const insuredAddr =
    policy?.insured?.address ??
    policy?.insuredAddress ??
    null;

  const producerName =
    policy?.producer?.name ??
    policy?.producerName ??
    '';

  const producerPhone =
    policy?.producer?.phone ??
    policy?.producerPhone ??
    '';

  // Dates: prefer quote dates (like old caller), else policy dates
  const eff = toDate(quote?.effectiveDate ?? policy?.effectiveDate);
  const exp = toDate(quote?.expirationDate ?? policy?.expirationDate);

  // Limits: prefer quote.limits (like old caller), else policy.limits
  const limits = quote?.limits ?? policy?.limits ?? {};

  const occurrenceLimit = pickLimit(limits, ['occurrenceLimit', 'occurrence']);
  const premisesRentedToYouLimit = pickLimit(limits, [
    'premisesRentedToYouLimit',
    'premisesRented',
    'premises'
  ]);
  const medicalPaymentsLimit = pickLimit(limits, ['medicalPaymentsLimit', 'medicalPayments']);
  const aggregateLimit = pickLimit(limits, ['aggregateLimit', 'generalAggregate', 'aggregate']);

  // Description: prefer transformed.description, else coverageSummary
  const description = transformed?.description ?? policy?.description ?? coverageSummary;

  // Certificate number: fixture-backed for MVP
  const certificateNumber =
    policy?.certificateNumber ??
    transformed?.certificateNumber ??
    1;

  // Policy number
  const policyNumber = policy?.policyNumber ?? policy?.policyFoxdenId ?? transformed?.policyFoxdenId ?? '';

  return {
    applicationId: transformed.applicationId,
    geography,
    lob,

    // Common identifiers
    policyNumber,
    certificateNumber,

    insured: {
      name: insuredName,
      address: insuredAddr,
      addressLine: addressLine(insuredAddr),
      block: insuredBlock(insuredName, insuredAddr)
    },

    // certificate holder / additional insured (same data, different naming)
    additionalInsured: {
      name: certificateHolder.name,
      address: certificateHolder.address,
      addressLine: addressLine(certificateHolder.address)
    },
    certificateHolder: {
      name: certificateHolder.name,
      address: certificateHolder.address
    },

    producer: {
      name: producerName,
      phone: producerPhone
    },

    dates: {
      effectiveDate: eff,
      expirationDate: exp
    },

    limits: {
      occurrenceLimit,
      premisesRentedToYouLimit,
      medicalPaymentsLimit,
      aggregateLimit
    },

    description,

    coverages,
    coverageSummary
  };
}
