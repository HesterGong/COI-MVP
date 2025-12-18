import { InMemoryEventBus } from './bus.mjs';
import { randomId, COIRequested } from './types.mjs';
import { CoiFinalizer } from './finalizer.mjs';
import { generateCOI } from './generator/generateCOI.mjs';

const bus = new InMemoryEventBus();

/**
 * =========================
 * Shared subscriber
 * =========================
 * Geography-specific behavior is handled inside generateCOI → loadPdf
 */
bus.subscribe('COIRequested', async (evt) => {
  const finalizer = new CoiFinalizer({ expectedLobs: evt.lobs });

  for (const lob of evt.lobs) {
    // get coi config for this lob, geography, carrierPartner combo
    const { pdfBytes } = await generateCOI({
      workflowId: evt.workflowId,
      policyFoxdenId: evt.policyFoxdenId,
      lob,
      geography: evt.geography,
      carrierPartner: evt.carrierPartner,
      timeZone: evt.timeZone,
      additionalInsured: evt.additionalInsured
    });

    await finalizer.onLobDone({
      workflowId: evt.workflowId,
      lob,
      pdfBytes
    });
  }
});

/**
 * =========================
 * US publish (UNCHANGED)
 * =========================
 */
{
  const workflowId = randomId();
  const selectedLobs = ['GL', 'EO'];

  await bus.publish(
    COIRequested({
      workflowId,
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

/**
 * =========================
 * Canada publish (NEW)
 * =========================
 */
{
  const workflowId = randomId();
  const selectedLobs = ['GL']; // Canada MVP: GL only

  await bus.publish(
    COIRequested({
      workflowId,
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
