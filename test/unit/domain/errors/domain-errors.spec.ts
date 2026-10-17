import { BusinessRuleViolationError } from '@domain/errors/business-rule-violation.error.js';
import { DomainError } from '@domain/errors/domain.error.js';
import { ItemNotFoundError } from '@domain/errors/item-not-found.error.js';
import { describe, expect, it } from 'vitest';

describe('Domain errors', () => {
  it('names a business rule violation after its class', () => {
    const error = new BusinessRuleViolationError('Amount must be positive');

    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('BusinessRuleViolationError');
    expect(error.message).toBe('Amount must be positive');
  });

  it('provides a default message when an item is not found', () => {
    const error = new ItemNotFoundError();

    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('ItemNotFoundError');
    expect(error.message).toBe('Item not found');
  });
});
