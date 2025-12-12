export const FIXTURES = {
  general_liability_policies: [
    {
      workflowId: 'any',
      policyFoxdenId: 'POLICY-ROOT-123',
      lob: 'GL',
      geography: 'US',

      description: 'Consulting, Software Development',

      policy: {
        policyFoxdenId: 'POLICY-ROOT-123',
        policyNumber: 'GL-000123',
        certificateNumber: 1,

        insured: {
          name: 'Acme Inc (DBA Acme Consulting)',
          address: {
            street: '10 King St',
            city: 'New York',
            province: 'NY',
            postalCode: '10001'
          }
        },

        producer: {
          name: 'Foxquilt Insurance Services',
          phone: '(888) 555-0100'
        }
      },

      quote: {
        effectiveDate: '2025-01-01T00:00:00.000Z',
        expirationDate: '2026-01-01T00:00:00.000Z',
        limits: {
          occurrenceLimit: 1000000,
          premisesRentedToYouLimit: 300000,
          medicalPaymentsLimit: 5000,
          aggregateLimit: 2000000
        }
      },

      coverages: [
        { name: 'General Liability', limit: '$1,000,000', deductible: '$0' }
      ]
    }
  ],

  eo_policies: [
    {
      workflowId: 'any',
      policyFoxdenId: 'POLICY-ROOT-123',
      lob: 'EO',
      geography: 'US',

      description: 'Professional Liability (E&O)',

      policy: {
        policyFoxdenId: 'POLICY-ROOT-123',
        policyNumber: 'EO-000777',
        certificateNumber: 1,

        insured: {
          name: 'Acme Inc (DBA Acme Consulting)',
          address: {
            street: '10 King St',
            city: 'New York',
            province: 'NY',
            postalCode: '10001'
          }
        },

        producer: {
          name: 'Foxquilt Insurance Services',
          phone: '(888) 555-0100'
        }
      },

      quote: {
        effectiveDate: '2025-01-01T00:00:00.000Z',
        expirationDate: '2026-01-01T00:00:00.000Z',
        limits: {
          occurrenceLimit: 1000000,
          premisesRentedToYouLimit: 0,
          medicalPaymentsLimit: 0,
          aggregateLimit: 1000000
        }
      },

      coverages: [
        { name: 'Professional Liability', limit: '$1,000,000', deductible: '$0' }
      ]
    }
  ]
};
