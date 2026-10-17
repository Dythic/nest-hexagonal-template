import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const FieldErrorSchema = z.object({
  field: z.string().describe('The path of the invalid field.'),
  message: z.string().describe('The reason why the field is invalid.'),
});

export const AppErrorResponseSchema = z.object({
  statusCode: z.number().int().describe('The HTTP status code of the error response.'),
  message: z.string().describe('A human-readable description of the error.'),
  error: z.string().describe('A short string identifying the error type.'),
  timestamp: z.iso.datetime().describe('The ISO 8601 timestamp when the error occurred.'),
  path: z.string().describe('The request path that triggered the error.'),
  details: z
    .union([z.array(FieldErrorSchema), z.record(z.string(), z.unknown())])
    .nullable()
    .describe('Detailed information about the error, such as validation failures.'),
});

export type AppErrorResponse = z.infer<typeof AppErrorResponseSchema>;

export class AppErrorResponseDto extends createZodDto(AppErrorResponseSchema) {}
