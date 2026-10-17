import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const PubSubPushEnvelopeRequestSchema = z.looseObject({
  message: z.looseObject({
    data: z.string().describe('Base64 encoded JSON payload.'),
    messageId: z.string(),
    publishTime: z.string(),
  }),
  subscription: z.string(),
});

export type PubSubPushEnvelopeRequest = Readonly<z.infer<typeof PubSubPushEnvelopeRequestSchema>>;

export class PubSubPushEnvelopeRequestDto extends createZodDto(PubSubPushEnvelopeRequestSchema) {}
