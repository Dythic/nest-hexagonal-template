import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { ErrorReplyPayload, replyWithError } from './error-reply.js';

const IssuesCarrierSchema = z.object({
  issues: z.array(
    z.object({
      path: z.array(z.union([z.string(), z.number(), z.symbol()])),
      message: z.string(),
    }),
  ),
});

/**
 * Tells whether an unknown value is a Zod error.
 * Relies on the error name because Zod 4 overrides `instanceof` on its error classes, which makes it unreliable.
 */
export const isZodError = (value: unknown): value is Error => value instanceof Error && value.name === 'ZodError';

/**
 * Builds a 400 payload listing every invalid field carried by a Zod error.
 */
export const toValidationErrorPayload = (source: unknown): ErrorReplyPayload => {
  const parsed = IssuesCarrierSchema.safeParse(source);
  const details = parsed.success
    ? parsed.data.issues.map((issue) => ({
        field: issue.path.map((segment) => String(segment)).join('.'),
        message: issue.message,
      }))
    : [];

  return {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'Validation failed',
    error: 'Bad Request',
    details,
  };
};

@Catch(ZodValidationException)
export class ZodValidationExceptionFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost): void {
    replyWithError(host, toValidationErrorPayload(exception.getZodError()));
  }
}
