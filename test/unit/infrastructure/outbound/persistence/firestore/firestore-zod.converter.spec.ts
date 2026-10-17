import { BaseDocumentSchema } from '@infrastructure/outbound/persistence/firestore/entities/base.document.js';
import { firestoreZodConverter } from '@infrastructure/outbound/persistence/firestore/utils/firestore-zod.converter.js';
import { QueryDocumentSnapshot, Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

const createSnapshot = (data: unknown): QueryDocumentSnapshot =>
  ({ data: (): unknown => data }) as unknown as QueryDocumentSnapshot;

describe('firestoreZodConverter', () => {
  const converter = firestoreZodConverter(BaseDocumentSchema);
  const date = new Date('2026-01-01T00:00:00.000Z');

  it('converts Firestore timestamps to dates when reading', () => {
    const snapshot = createSnapshot({
      id: 'doc-1',
      createdAt: Timestamp.fromDate(date),
      updatedAt: Timestamp.fromDate(date),
    });

    expect(converter.fromFirestore(snapshot)).toEqual({ id: 'doc-1', createdAt: date, updatedAt: date });
  });

  it('validates documents before writing them', () => {
    expect(converter.toFirestore({ id: 'doc-1', createdAt: date, updatedAt: date })).toEqual({
      id: 'doc-1',
      createdAt: date,
      updatedAt: date,
    });
  });

  it('rejects an invalid stored document', () => {
    expect(() => converter.fromFirestore(createSnapshot({ id: '' }))).toThrow(ZodError);
  });
});
