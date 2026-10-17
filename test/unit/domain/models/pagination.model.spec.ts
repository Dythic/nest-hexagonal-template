import { PaginatedFactory, Pagination } from '@domain/models/pagination.model.js';
import { describe, expect, it } from 'vitest';

describe('PaginatedFactory', () => {
  const pagination: Pagination = { page: 2, itemsPerPage: 10, sortOrder: 'asc' };

  it('computes the total number of pages', () => {
    const page = PaginatedFactory.create(['a', 'b'], pagination, 21);

    expect(page).toEqual({ items: ['a', 'b'], page: 2, itemsPerPage: 10, totalItems: 21, totalPages: 3 });
  });

  it('returns zero pages when there is no item', () => {
    expect(PaginatedFactory.create([], pagination, 0).totalPages).toBe(0);
  });

  it('computes the offset of a page', () => {
    expect(PaginatedFactory.offsetOf(pagination)).toBe(10);
    expect(PaginatedFactory.offsetOf({ ...pagination, page: 1 })).toBe(0);
  });
});
