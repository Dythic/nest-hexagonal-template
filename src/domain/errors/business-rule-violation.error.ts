import { DomainError } from './domain.error.js';

/**
 * Raised when a factory or a domain function detects that a business invariant is broken.
 */
export class BusinessRuleViolationError extends DomainError {}
