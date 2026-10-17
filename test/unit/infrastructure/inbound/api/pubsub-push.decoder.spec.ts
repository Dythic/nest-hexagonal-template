import { decodePubSubPushMessage } from '@infrastructure/inbound/api/pubsub/pubsub-push.decoder.js';
import { PubSubPushEnvelopeRequest } from '@infrastructure/inbound/api/pubsub/pubsub-push-envelope-request.dto.js';
import { describe, expect, it } from 'vitest';
import { z, ZodError } from 'zod';

const createEnvelope = (payload: unknown): PubSubPushEnvelopeRequest => ({
  message: {
    data: Buffer.from(JSON.stringify(payload)).toString('base64'),
    messageId: '1',
    publishTime: '2026-01-01T00:00:00.000Z',
  },
  subscription: 'projects/demo/subscriptions/test',
});

describe('decodePubSubPushMessage', () => {
  const PayloadSchema = z.object({ id: z.string() });

  it('decodes and validates the payload', () => {
    expect(decodePubSubPushMessage(createEnvelope({ id: 'abc' }), PayloadSchema)).toEqual({ id: 'abc' });
  });

  it('rejects a payload that does not match the schema', () => {
    expect(() => decodePubSubPushMessage(createEnvelope({ id: 42 }), PayloadSchema)).toThrow(ZodError);
  });
});
