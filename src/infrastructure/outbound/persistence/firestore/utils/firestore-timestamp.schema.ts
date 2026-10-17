import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

/**
 * Accepts a Firestore {@link Timestamp} or a native Date and always outputs a Date.
 */
export const FirestoreTimestampSchema = z
  .union([z.instanceof(Timestamp), z.date()])
  .transform((value): Date => (value instanceof Timestamp ? value.toDate() : value));
