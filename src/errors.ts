/**
 * Error types.
 */
export class PocketRequestError extends Error {
  public readonly xError: string;

  constructor(message: string, xError: string) {
    super(message);
    this.name = new.target.name;
    this.xError = xError;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  toString(): string {
    return `${this.name}: ${this.message} [${this.xError}]`;
  }
}

export class PocketAuthenticationError extends PocketRequestError {}

export const ERROR_BY_NAME: {[name: string]: typeof PocketRequestError} = {
  PocketRequestError,
  PocketAuthenticationError,
};
Object.freeze(ERROR_BY_NAME);
