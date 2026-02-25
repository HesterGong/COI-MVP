import get from 'lodash/get';
import { Canonical } from '../../types';

/**
 * Port from coi-mvp-etl/src/generator/map/mapData.mjs
 *
 * Maps canonical model fields to renderer-ready flat object using lodash.get dot-notation paths.
 *
 * Context structure: { canonical, lob, geography, carrierPartner, timeZone, now }
 * Missing paths return undefined without throwing.
 */
export function mapData(
  ctx: {
    canonical: Canonical;
    lob: string;
    geography: 'US' | 'CA';
    carrierPartner: string;
    timeZone: string;
    now: Date;
  },
  fieldMappings: Record<string, string>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fieldMappings).map(([key, path]) => [key, get(ctx, path)]),
  );
}
