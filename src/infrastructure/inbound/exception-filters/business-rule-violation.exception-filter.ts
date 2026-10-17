import { BusinessRuleViolationError } from '@domain/errors/business-rule-violation.error.js';
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { replyWithError } from './error-reply.js';

@Catch(BusinessRuleViolationError)
export class BusinessRuleViolationExceptionFilter implements ExceptionFilter {
  catch(exception: BusinessRuleViolationError, host: ArgumentsHost): void {
    replyWithError(host, {
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
      details: null,
    });
  }
}
