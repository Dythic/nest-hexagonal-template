import { z } from 'zod';

export const SortOrderSchema = z.enum(['asc', 'desc']);

export type SortOrder = z.infer<typeof SortOrderSchema>;

export const PaginationSchema = z.object({
  page: z.number().int().positive(),
  itemsPerPage: z.number().int().positive(),
  sortOrder: SortOrderSchema,
});

export type Pagination = Readonly<z.infer<typeof PaginationSchema>>;

export type Paginated<T> = Readonly<{
  items: ReadonlyArray<T>;
  page: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}>;

export const PaginatedFactory = {
  create: <T>(items: ReadonlyArray<T>, pagination: Pagination, totalItems: number): Paginated<T> => ({
    items,
    page: pagination.page,
    itemsPerPage: pagination.itemsPerPage,
    totalItems,
    totalPages: Math.ceil(totalItems / pagination.itemsPerPage),
  }),

  offsetOf: (pagination: Pagination): number => (pagination.page - 1) * pagination.itemsPerPage,
};
