import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { pinoHttp, type HttpLogger } from 'pino-http';
import { logger } from '../lib/logger.js';

const REQUEST_ID_MAX_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

const normalizeRequestId = (value: unknown): string => {
  if (typeof value !== 'string') {
    return randomUUID();
  }

  const normalized = value.trim();
  if (
    normalized.length === 0 ||
    normalized.length > REQUEST_ID_MAX_LENGTH ||
    !REQUEST_ID_PATTERN.test(normalized)
  ) {
    return randomUUID();
  }

  return normalized;
};

export const requestLogger: HttpLogger<Request, Response> = pinoHttp<Request, Response>({
  logger,
  genReqId: (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id = Array.isArray(incoming) ? incoming[0] : incoming;
    const reqId = normalizeRequestId(id);

    res.setHeader('x-request-id', reqId);
    return reqId;
  },
  customProps: (req) => ({
    ip: req.ip,
  }),
});
