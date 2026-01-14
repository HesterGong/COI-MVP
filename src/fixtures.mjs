/**
 * MVP fixture store. In production this would be MongoDB collections.
 *
 * We model:
 * - a "root" application/policy id (policyFoxdenId)
 * - LOB-specific "collections" (general_liability_policies, eo_policies, bop_policies)
 *
 * The ETL extract step selects the correct collection based on COIConfig.dbCollection.
 */
export const fixtures = {
  collections: {
    general_liability_policies: {
      'POLICY-ROOT-123': {
        policyFoxdenId: 'POLICY-ROOT-123',
        policyNumber: 'SN-GL-000123',
        insured: {
          name: 'Acme Coffee Roasters Inc.',
          address: {
            street: '10 King St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5H 1A1'
          }
        },
        producer: { name: 'Foxquilt Insurance', phone: '+1-555-0100' },
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        carrierPartner: 'StateNational'
      },

      'POLICY-ROOT-US-123': {
        policyFoxdenId: 'POLICY-ROOT-US-123',
        policyNumber: 'SN-GL-US-000123',
        insured: {
          name: 'Acme Coffee Roasters Inc.',
          address: {
            street: '10 King St',
            city: 'New York',
            province: 'NY',
            postalCode: '10001'
          }
        },
        producer: { name: 'Foxquilt Insurance', phone: '+1-555-0100' },
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        carrierPartner: 'StateNational'
      },

      'POLICY-ROOT-CA-123': {
        policyFoxdenId: 'POLICY-ROOT-CA-123',
        policyNumber: 'FQ-GL-CA-000123',
        insured: {
          name: 'Acme Coffee Roasters Inc.',
          address: {
            street: '10 King St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5H 1A1'
          }
        },
        producer: { name: 'Foxquilt Insurance', phone: '+1-555-0100' },
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        carrierPartner: 'Foxquilt'
      }
    },

    eo_policies: {
      'POLICY-ROOT-123': {
        policyFoxdenId: 'POLICY-ROOT-123',
        policyNumber: 'SN-EO-000456',
        insured: {
          name: 'Acme Coffee Roasters Inc.',
          address: {
            street: '10 King St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5H 1A1'
          }
        },
        producer: { name: 'Foxquilt Insurance', phone: '+1-555-0100' },
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        carrierPartner: 'StateNational'
      },

      'POLICY-ROOT-US-123': {
        policyFoxdenId: 'POLICY-ROOT-US-123',
        policyNumber: 'SN-EO-US-000456',
        insured: {
          name: 'Acme Coffee Roasters Inc.',
          address: {
            street: '10 King St',
            city: 'New York',
            province: 'NY',
            postalCode: '10001'
          }
        },
        producer: { name: 'Foxquilt Insurance', phone: '+1-555-0100' },
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        carrierPartner: 'StateNational'
      }
    },

    bop_policies: {
      'POLICY-ROOT-123': {
        policyFoxdenId: 'POLICY-ROOT-123',
        policyNumber: 'SN-BOP-000789',
        insured: {
          name: 'Acme Coffee Roasters Inc.',
          address: {
            street: '10 King St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5H 1A1'
          }
        },
        producer: { name: 'Foxquilt Insurance', phone: '+1-555-0100' },
        effectiveDate: '2025-01-01',
        expirationDate: '2026-01-01',
        carrierPartner: 'StateNational'
      }
    }
  },

  coveragesByLob: {
    GL: [
      { code: 'GL', name: 'Commercial General Liability', limit: 2_000_000, deductible: 0 }
    ],
    EO: [
      { code: 'EO', name: 'Professional Liability (E&O)', limit: 1_000_000, deductible: 1_000 }
    ],
    BOP: [
      { code: 'BOP', name: 'Business Owner’s Policy', limit: 2_500_000, deductible: 500 }
    ]
  }
};

export function getPolicyFromCollection(dbCollection, policyFoxdenId) {
  const c = fixtures.collections[dbCollection];
  if (!c) throw new Error(`Unknown dbCollection fixture: ${dbCollection}`);
  const p = c[policyFoxdenId];
  if (!p) throw new Error(`Unknown policyFoxdenId in ${dbCollection}: ${policyFoxdenId}`);
  return p;
}

export function getCoveragesForLob(lob) {
  const coverages = fixtures.coveragesByLob[lob];
  if (!coverages) throw new Error(`Unknown LOB: ${lob}`);
  return coverages;
}
