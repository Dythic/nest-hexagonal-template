import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { z } from 'zod';
import { ErrorReplyPayload, replyWithError } from './error-reply.js';
import { isZodError, toValidationErrorPayload } from './zod-validation.exception-filter.js';

const HttpExceptionBodySchema = z.object({
  message: z.union([z.string(), z.array(z.string())]).optional(),
  error: z.string().optional(),
});

type HttpExceptionBody = z.infer<typeof HttpExceptionBodySchema>;

const fromHttpException = (exception: HttpException): ErrorReplyPayload => {
  const parsedBody = HttpExceptionBodySchema.safeParse(exception.getResponse());
  const body: HttpExceptionBody = parsedBody.success ? parsedBody.data : {};
  const message = body.message ?? exception.message;

  return {
    statusCode: exception.getStatus(),
    message: Array.isArray(message) ? message.join(', ') : message,
    error: body.error ?? exception.name,
    details: null,
  };
};

const INTERNAL_SERVER_ERROR: ErrorReplyPayload = {
  statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
  message: 'Internal server error',
  error: 'Internal Server Error',
  details: null,
};

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (exception instanceof HttpException) {
      replyWithError(host, fromHttpException(exception));
      return;
    }

    if (isZodError(exception)) {
      replyWithError(host, toValidationErrorPayload(exception));
      return;
    }

    this.logger.error(exception);
    replyWithError(host, INTERNAL_SERVER_ERROR);
  }
}
