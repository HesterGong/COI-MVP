import { Db, MongoClient } from 'mongodb';
import { COIContext, Logger } from './types';

/** Simple console logger that matches the Logger interface */
function createLogger(prefix = 'coi-service'): Logger {
  return {
    debug: (msg, meta?) => console.debug(`[${prefix}] DEBUG ${msg}`, meta ?? ''),
    info: (msg, meta?) => console.info(`[${prefix}] INFO  ${msg}`, meta ?? ''),
    warn: (msg, meta?) => console.warn(`[${prefix}] WARN  ${msg}`, meta ?? ''),
    error: (msg, meta?) => console.error(`[${prefix}] ERROR ${msg}`, meta ?? ''),
  };
}

export async function connectMongo(uri: string): Promise<{ client: MongoClient; db: Db }> {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  return { client, db };
}

export function buildContext(db: Db): COIContext {
  return {
    db,
    logger: createLogger(),
    now: new Date(),
  };
}
