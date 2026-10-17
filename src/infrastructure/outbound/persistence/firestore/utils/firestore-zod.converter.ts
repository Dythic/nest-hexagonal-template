import { DocumentData, FirestoreDataConverter, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { z } from 'zod';

/**
 * Builds a Firestore converter validating every read and write against a Zod schema.
 */
export const firestoreZodConverter = <T extends DocumentData>(schema: z.ZodType<T>): FirestoreDataConverter<T> => ({
  toFirestore: (document: T): DocumentData => schema.parse(document),
  fromFirestore: (snapshot: QueryDocumentSnapshot): T => schema.parse(snapshot.data()),
});
