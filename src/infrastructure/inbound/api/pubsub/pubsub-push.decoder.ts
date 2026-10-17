import { z } from 'zod';
import { PubSubPushEnvelopeRequest } from './pubsub-push-envelope-request.dto.js';

/**
 * Decodes the base64 payload of a Pub/Sub push envelope and validates it against a Zod schema.
 * @throws ZodError when the payload does not match the schema.
 */
export const decodePubSubPushMessage = <T>(envelope: PubSubPushEnvelopeRequest, schema: z.ZodType<T>): Readonly<T> => {
  const json: unknown = JSON.parse(Buffer.from(envelope.message.data, 'base64').toString('utf-8'));
  return schema.parse(json);
};
