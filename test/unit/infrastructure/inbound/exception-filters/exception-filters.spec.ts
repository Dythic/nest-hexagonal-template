import { BusinessRuleViolationError } from '@domain/errors/business-rule-violation.error.js';
import { ItemNotFoundError } from '@domain/errors/item-not-found.error.js';
import { BusinessRuleViolationExceptionFilter } from '@infrastructure/inbound/exception-filters/business-rule-violation.exception-filter.js';
import { GlobalExceptionFilter } from '@infrastructure/inbound/exception-filters/global.exception-filter.js';
import { ItemNotFoundExceptionFilter } from '@infrastructure/inbound/exception-filters/item-not-found.exception-filter.js';
import { ZodValidationExceptionFilter } from '@infrastructure/inbound/exception-filters/zod-validation.exception-filter.js';
import { BadRequestException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z, ZodError } from 'zod';
import { createFakeHttpHost } from '../../../../support/fake-http-host.js';

const createZodError = (): ZodError => {
  const result = z.object({ user: z.object({ name: z.string() }) }).safeParse({ user: {} });

  if (result.success) {
    throw new Error('Expected the payload to be invalid');
  }

  return result.error;
};

describe('Exception filters', () => {
  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'error').mockImplementation((): void => undefined);
  });

  it('maps a business rule violation to 400', () => {
    const { host, reply } = createFakeHttpHost('/items');

    new BusinessRuleViolationExceptionFilter().catch(new BusinessRuleViolationError('Name is required'), host);

    expect(reply.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      statusCode: 400,
      message: 'Name is required',
      error: 'Bad Request',
      path: '/items',
      details: null,
    });
  });

  it('maps a missing item to 404', () => {
    const { host, reply } = createFakeHttpHost('/items/42');

    new ItemNotFoundExceptionFilter().catch(new ItemNotFoundError("Item '42' not found."), host);

    expect(reply.statusCode).toBe(HttpStatus.NOT_FOUND);
    expect(reply.body).toMatchObject({ statusCode: 404, message: "Item '42' not found.", error: 'Not Found' });
  });

  it('maps a request validation failure to 400 with field details', () => {
    const { host, reply } = createFakeHttpHost();

    new ZodValidationExceptionFilter().catch(new ZodValidationException(createZodError()), host);

    expect(reply.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({
      message: 'Validation failed',
      details: [{ field: 'user.name', message: expect.any(String) as string }],
    });
  });

  it('maps a raw Zod error to 400 with field details', () => {
    const { host, reply } = createFakeHttpHost();

    new GlobalExceptionFilter().catch(createZodError(), host);

    expect(reply.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({ details: [{ field: 'user.name' }] });
  });

  it('keeps the status and message of an HTTP exception', () => {
    const { host, reply } = createFakeHttpHost();

    new GlobalExceptionFilter().catch(new BadRequestException(['first', 'second']), host);

    expect(reply.statusCode).toBe(HttpStatus.BAD_REQUEST);
    expect(reply.body).toMatchObject({ message: 'first, second', error: 'Bad Request' });
  });

  it('handles an HTTP exception built from a plain string', () => {
    const { host, reply } = createFakeHttpHost();

    new GlobalExceptionFilter().catch(new HttpException('Teapot', HttpStatus.I_AM_A_TEAPOT), host);

    expect(reply.statusCode).toBe(HttpStatus.I_AM_A_TEAPOT);
    expect(reply.body).toMatchObject({ message: 'Teapot' });
  });

  it('hides unexpected errors behind a 500', () => {
    const { host, reply } = createFakeHttpHost();

    new GlobalExceptionFilter().catch(new Error('database password leaked'), host);

    expect(reply.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(reply.body).toMatchObject({ message: 'Internal server error', error: 'Internal Server Error' });
  });
});
