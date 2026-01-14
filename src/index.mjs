import { InMemoryEventBus } from './bus.mjs';
import { randomId, COIRequested } from './types.mjs';
import { generateCOI } from './generator/generateCOI.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';

const bus = new InMemoryEventBus();
const OUT_DIR = path.resolve('./out');

bus.subscribe('COIRequested', async (evt) => {
  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const lob of evt.lobs) {
    const { pdfBytes } = await generateCOI({
      applicationId: evt.applicationId,
      policyFoxdenId: evt.policyFoxdenId,
      lob,
      geography: evt.geography,
      carrierPartner: evt.carrierPartner,
      timeZone: evt.timeZone,
      additionalInsured: evt.additionalInsured
    });

    const outPath = path.join(OUT_DIR, `COI_${evt.applicationId}_${lob}.pdf`);
    await fs.writeFile(outPath, pdfBytes);

    // MVP “email”
    console.log(`EMAIL SENT (log only): ${outPath}`);
  }
});

// US publish
{
  const applicationId = randomId();
  const selectedLobs = ['GL', 'EO'];

  await bus.publish(
    COIRequested({
      applicationId,
      policyFoxdenId: 'POLICY-ROOT-US-123',
      geography: 'US',
      timeZone: 'America/New_York',
      carrierPartner: 'StateNational',
      lobs: selectedLobs,
      additionalInsured: {
        name: 'Big Bank Ltd',
        address: {
          street: '1 Main St',
          city: 'New York',
          province: 'NY',
          postalCode: '10001'
        }
      }
    })
  );
}

// Canada publish
{
  const applicationId = randomId();
  const selectedLobs = ['GL']; // Canada MVP: GL only

  await bus.publish(
    COIRequested({
      applicationId,
      policyFoxdenId: 'POLICY-ROOT-CA-123',
      geography: 'CA',
      timeZone: 'America/Toronto',
      carrierPartner: 'Foxquilt',
      lobs: selectedLobs,
      additionalInsured: {
        name: 'Big Bank Ltd',
        address: {
          street: '1 King St W',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5H 1J8'
        }
      }
    })
  );
}
