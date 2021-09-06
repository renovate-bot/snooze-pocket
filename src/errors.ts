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

  static fromCaught(error: unknown, xError = '<unknown>'): PocketRequestError {
    if (error instanceof PocketRequestError) {
      return error;
    } else if (error instanceof Error) {
      return new PocketRequestError(error.message, xError);
    } else {
      return new PocketRequestError('<unknown>', xError);
    }
  }
}

export class PocketAuthenticationError extends PocketRequestError {}

export const ERROR_BY_NAME: {[name: string]: typeof PocketRequestError} = {
  PocketRequestError,
  PocketAuthenticationError,
};
Object.freeze(ERROR_BY_NAME);
