/**
 * Base class for every error raised by the domain layer.
 * Infrastructure exception filters translate these errors into transport responses.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
