import { Pagination, SortOrderSchema } from '@domain/models/pagination.model.js';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const MAX_ITEMS_PER_PAGE = 100;

export const PaginationRequestSchema = z.object({
  page: z.coerce.number().int().positive().default(1).describe('Page number, starting at 1.'),
  itemsPerPage: z.coerce
    .number()
    .int()
    .positive()
    .max(MAX_ITEMS_PER_PAGE)
    .default(10)
    .describe('Number of items returned per page.'),
  sortOrder: SortOrderSchema.default('desc').describe('Sorting order on the creation date.'),
});

export type PaginationRequest = Readonly<z.infer<typeof PaginationRequestSchema>>;

export class PaginationRequestDto extends createZodDto(PaginationRequestSchema) {}

export const toPagination = (request: PaginationRequest): Pagination => ({
  page: request.page,
  itemsPerPage: request.itemsPerPage,
  sortOrder: request.sortOrder,
});
