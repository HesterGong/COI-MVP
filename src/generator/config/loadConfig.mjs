import { findConfig } from './coiConfig.local.mjs';

export async function loadConfig({ lob, geography, carrierPartner }) {
  const config = findConfig({ lob, geography, carrierPartner });
  if (!config) {
    throw new Error(`No COIConfig for lob=${lob} geography=${geography} carrierPartner=${carrierPartner}`);
  }
  return config;
}
