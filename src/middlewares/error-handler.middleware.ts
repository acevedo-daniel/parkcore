import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';

type ErrorWithStatus = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
};

function isJsonSyntaxError(err: ErrorWithStatus): boolean {
  return (
    err instanceof SyntaxError &&
    err.status === 400 &&
    ('body' in err || err.type === 'entity.parse.failed')
  );
}

function isEntityTooLargeError(err: ErrorWithStatus): boolean {
  return err.type === 'entity.too.large' || err.status === 413;
}

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toErrorWithStatus(err: unknown): ErrorWithStatus {
  if (err instanceof Error) {
    return err;
  }

  if (isObject(err)) {
    const normalized: ErrorWithStatus = new Error(
      typeof err.message === 'string' ? err.message : 'Unexpected error object',
    );

    if (typeof err.status === 'number') {
      normalized.status = err.status;
    }

    if (typeof err.statusCode === 'number') {
      normalized.statusCode = err.statusCode;
    }

    if (typeof err.type === 'string') {
      normalized.type = err.type;
    }

    return normalized;
  }

  return new Error('Unexpected non-error thrown');
}

export const errorHandler = (err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const normalizedError = toErrorWithStatus(err);

  if (isEntityTooLargeError(normalizedError)) {
    return res.status(413).json({
      error: true,
      message: 'Payload too large',
    });
  }

  if (isJsonSyntaxError(normalizedError)) {
    return res.status(400).json({
      error: true,
      message: 'Invalid JSON payload',
    });
  }

  if (normalizedError instanceof ZodError) {
    return res.status(400).json({
      error: true,
      message: formatZodError(normalizedError),
    });
  }

  if (normalizedError instanceof AppError && normalizedError.isOperational) {
    logger.warn(
      {
        message: normalizedError.message,
        statusCode: normalizedError.statusCode,
        path: req.path,
      },
      'Operational error',
    );

    return res.status(normalizedError.statusCode).json({
      error: true,
      message: normalizedError.message,
    });
  }

  logger.error(
    {
      err: normalizedError,
      error: normalizedError.message,
      path: req.path,
    },
    'Unexpected error',
  );

  return res.status(500).json({
    error: true,
    message: 'Internal Server Error',
  });
};
