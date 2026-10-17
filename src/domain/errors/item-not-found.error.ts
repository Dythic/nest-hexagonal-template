import { DomainError } from './domain.error.js';

/**
 * Raised when a requested aggregate does not exist.
 */
export class ItemNotFoundError extends DomainError {
  constructor(message: string = 'Item not found') {
    super(message);
  }
}
