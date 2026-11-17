import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestContext, type TestContext } from '../helpers/test-app.js';
import { signBookingPayload } from '../../src/modules/integrations/booking.webhook.js';

let ctx: TestContext;
const SECRET = process.env.BOOKING_WEBHOOK_SECRET ?? '';

beforeAll(async () => {
  ctx = await createTestContext();
});

afterAll(async () => {
  await ctx.close();
});

describe('booking webhook', () => {
  it('rejects deliveries with no signature', async () => {
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/bookings/calendly',
      headers: { 'content-type': 'application/json' },
      payload: { event: 'booking.created' },
    });
    expect(response.statusCode).toBe(401);
  });

  it('rejects a valid-looking signature over a different body', async () => {
    const ts = Math.floor(Date.now() / 1000);
    const signed = signBookingPayload(SECRET, ts, Buffer.from('{"event":"booking.created"}'));
    const response = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/webhooks/bookings/calendly',
      headers: {
        'content-type': 'application/json',
        'x-booking-timestamp': String(ts),
        'x-booking-signature': signed,
      },
      payload: '{"event":"booking.cancelled"}',
    });
    expect(response.statusCode).toBe(401);
  });
});
