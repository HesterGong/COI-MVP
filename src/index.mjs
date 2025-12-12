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
    const { pdfBytes } = await generateCOI({
      workflowId: evt.correlationId,
      policyFoxdenId: evt.policyFoxdenId,
      lob,
      geography: evt.geography,
      carrierPartner: evt.carrierPartner,
      timeZone: evt.timeZone,
      additionalInsured: evt.additionalInsured
    });

    await finalizer.onLobDone({
      correlationId: evt.correlationId,
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
  const correlationId = randomId();
  const selectedLobs = ['GL', 'EO'];

  await bus.publish(
    COIRequested({
      correlationId,
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
  const correlationId = randomId();
  const selectedLobs = ['GL']; // Canada MVP: GL only

  await bus.publish(
    COIRequested({
      correlationId,
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
