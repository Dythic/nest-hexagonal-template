import { z } from 'zod';

export type PaginatedResponseSchema<T extends z.ZodType> = z.ZodObject<{
  items: z.ZodArray<T>;
  page: z.ZodNumber;
  itemsPerPage: z.ZodNumber;
  totalItems: z.ZodNumber;
  totalPages: z.ZodNumber;
}>;

/**
 * Builds the response schema of a paginated endpoint from the schema of a single item.
 */
export const createPaginatedResponseSchema = <T extends z.ZodType>(itemSchema: T): PaginatedResponseSchema<T> =>
  z.object({
    items: z.array(itemSchema),
    page: z.number().int().describe('Current page number.'),
    itemsPerPage: z.number().int().describe('Number of items per page.'),
    totalItems: z.number().int().describe('Total number of items.'),
    totalPages: z.number().int().describe('Total number of pages.'),
  });
