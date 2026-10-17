import { z } from 'zod';
import { FirestoreTimestampSchema } from '../utils/firestore-timestamp.schema.js';

/**
 * Fields shared by every Firestore document.
 */
export const BaseDocumentSchema = z.object({
  id: z.string().min(1),
  createdAt: FirestoreTimestampSchema,
  updatedAt: FirestoreTimestampSchema,
});

export type BaseDocument = z.infer<typeof BaseDocumentSchema>;
