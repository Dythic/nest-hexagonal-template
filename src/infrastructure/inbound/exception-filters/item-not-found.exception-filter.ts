import { ItemNotFoundError } from '@domain/errors/item-not-found.error.js';
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { replyWithError } from './error-reply.js';

@Catch(ItemNotFoundError)
export class ItemNotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: ItemNotFoundError, host: ArgumentsHost): void {
    replyWithError(host, {
      statusCode: HttpStatus.NOT_FOUND,
      message: exception.message,
      error: 'Not Found',
      details: null,
    });
  }
}
