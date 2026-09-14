export interface AppErrorDetails {
  nextOpeningAt?: string | null;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string | undefined;
  public readonly details: AppErrorDetails | undefined;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = statusCode < 500,
    code?: string,
    details?: AppErrorDetails,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
