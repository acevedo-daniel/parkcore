import type { Request, Response } from 'express';
import type { Mock } from 'vitest';
import { vi } from 'vitest';

export type MockResponse = Omit<Response, 'status' | 'json' | 'send'> & {
  status: Mock<Response['status']>;
  json: Mock<Response['json']>;
  send: Mock<Response['send']>;
};

export const createMockRequest = (overrides?: Partial<Request>): Request => {
  const base: Partial<Request> = {
    headers: {},
  };

  return {
    ...base,
    ...(overrides ?? {}),
  } as Request;
};

export const createMockResponse = (): MockResponse => {
  const res = {} as MockResponse;

  res.status = vi.fn<Response['status']>().mockReturnValue(res);
  res.json = vi.fn<Response['json']>().mockReturnValue(res);
  res.send = vi.fn<Response['send']>().mockReturnValue(res);

  return res;
};
