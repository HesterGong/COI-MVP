import { COIConfig } from '../../types';
import { findConfig } from './coiConfig';

export async function loadConfig(params: {
  lob: string;
  geography: 'US' | 'CA';
  carrierPartner: string;
}): Promise<COIConfig> {
  const config = findConfig(params);
  if (!config) {
    throw new Error(
      `No COI config found for lob=${params.lob} geography=${params.geography} carrierPartner=${params.carrierPartner}`,
    );
  }
  return config;
}
