import { Db } from 'mongodb';
import { Logger } from '../../types';

export interface PolicyView {
  application: {
    _id: string;
    [key: string]: unknown;
  };
  applicationAnswers: {
    version: number;
    data: {
      applicationId: string;
      answers: Record<string, unknown>;
      timeZone: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  applicationOwner: {
    data: {
      authenticatedEmail: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  quote: {
    version: number;
    data: {
      kind: string;
      rating: {
        kind: string;
        input: unknown;
        [key: string]: unknown;
      };
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  policy: {
    version: number;
    data: {
      kind: string;
      policyId: string;
      carrierPartner?: string;
      coverage: {
        effectiveDate: Date;
        expiryDate: Date;
        [key: string]: unknown;
      };
      application: { _id: string; [key: string]: unknown };
      applicationAnswers: {
        data: {
          applicationId: string;
          answers: Record<string, unknown>;
          timeZone: string;
          [key: string]: unknown;
        };
        version: number;
        [key: string]: unknown;
      };
      policies: Array<{ kind: string; policyId: string; munichPolicyId?: string }>;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

/**
 * Port from foxden-policy-document-backend/src/services/utils/findPolicyHead.ts
 *
 * Aggregation pipeline:
 *   ActivePolicy → Policy → ApplicationAnswers → PolicyQuote → Quote
 *                → ApplicationOwner → Application
 *
 * Version validation: applicationAnswers v7, policy v6, quote v9
 */
export async function findPolicyHead(
  {
    db,
    policyFoxdenId,
  }: { db: Db; policyFoxdenId: string },
  logger: Logger,
): Promise<PolicyView | undefined> {
  const pipeline = [
    {
      $match: {
        'data.policyFoxdenId': policyFoxdenId,
      },
    },
    {
      $project: {
        activePolicy: '$$ROOT',
      },
    },
    {
      $lookup: {
        from: 'Policy',
        localField: 'activePolicy.data.policyObjectId',
        foreignField: '_id',
        as: 'policy',
      },
    },
    {
      $unwind: {
        path: '$policy',
      },
    },
    {
      $lookup: {
        from: 'ApplicationAnswers',
        localField: 'policy._id',
        foreignField: 'data.endorsementPolicyObjectId',
        as: 'applicationAnswers',
      },
    },
    {
      $unwind: {
        path: '$applicationAnswers',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'PolicyQuote',
        localField: 'policy._id',
        foreignField: 'data.policyObjectId',
        as: 'policyQuote',
      },
    },
    {
      $unwind: {
        path: '$policyQuote',
      },
    },
    {
      $lookup: {
        from: 'Quote',
        localField: 'policyQuote.data.quoteObjectId',
        foreignField: '_id',
        as: 'quote',
      },
    },
    {
      $unwind: {
        path: '$quote',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        applicationAnswers: {
          $cond: {
            if: {
              $ne: ['$policy.data.kind', 'Root'],
            },
            then: '$applicationAnswers',
            else: '$policy.data.applicationAnswers',
          },
        },
        quote: 1,
        policy: 1,
      },
    },
    {
      $lookup: {
        from: 'ApplicationOwner',
        localField: 'applicationAnswers.data.applicationId',
        foreignField: 'data.applicationId',
        as: 'applicationOwner',
      },
    },
    {
      $unwind: {
        path: '$applicationOwner',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: 'Application',
        localField: 'applicationAnswers.data.applicationId',
        foreignField: '_id',
        as: 'application',
      },
    },
    {
      $unwind: {
        path: '$application',
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  logger.debug('findPolicyHead: running aggregation', { policyFoxdenId });

  const cursor = db.collection('ActivePolicy').aggregate<PolicyView>(pipeline);

  try {
    const ret = await cursor.next();

    if (!ret) {
      return undefined;
    }

    if (await cursor.next()) {
      // Multiple active policies — inconsistent database
      throw new Error('Unreachable due to index - inconsistent database: multiple active policies');
    }

    const { applicationAnswers, policy, quote } = ret;

    if (applicationAnswers.version !== 7) {
      logger.error('applicationAnswersVersion changed', { version: applicationAnswers.version });
      throw new Error('Error: Application Data version changed');
    }

    if (policy.version !== 6) {
      logger.error('policyVersion changed', { version: policy.version });
      throw new Error('Error: Policy data version changed');
    }

    if (quote.version !== 9) {
      logger.error('quoteVersion changed', { version: quote.version });
      throw new Error('Error: Quote data version changed');
    }

    return ret;
  } finally {
    await cursor.close();
  }
}
