import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

const setRequiredEnv = (overrides?: Record<string, string>) => {
  process.env = {
    ...originalEnv,
    NODE_ENV: 'test',
    PORT: '3001',
    DATABASE_URL: 'postgresql://test:test@localhost:5432/parkcore_test',
    JWT_SECRET: 'test-secret-test-secret-test-secret-32',
    JWT_EXPIRES_IN: '1h',
    ...overrides,
  };
};

describe('env config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    setRequiredEnv();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('parses valid production config with explicit CORS origins', async () => {
    setRequiredEnv({
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://parkcore.app, https://admin.parkcore.app',
      LOG_PRETTY: 'false',
    });

    const module = await import('./env.js');

    expect(module.env.NODE_ENV).toBe('production');
    expect(module.env.CORS_ORIGINS).toContain('parkcore.app');
    expect(module.env.JWT_EXPIRES_IN).toBe('1h');
    expect(module.env.LOG_PRETTY).toBe(false);
  });

  it('parses LOG_PRETTY as strict boolean string', async () => {
    setRequiredEnv({
      LOG_PRETTY: 'true',
      ENABLE_API_DOCS: 'true',
    });

    const module = await import('./env.js');

    expect(module.env.LOG_PRETTY).toBe(true);
    expect(module.env.ENABLE_API_DOCS).toBe(true);
  });

  it('fails fast when production env is missing CORS_ORIGINS', async () => {
    setRequiredEnv({
      NODE_ENV: 'production',
    });
    delete process.env.CORS_ORIGINS;

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: number | string | null): never => {
        throw new Error(`process.exit:${String(code ?? '')}`);
      });

    await expect(import('./env.js')).rejects.toThrow('process.exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Invalid environment variables:');
  });

  it('fails fast when JWT_SECRET is shorter than 32 chars', async () => {
    setRequiredEnv({
      JWT_SECRET: 'short-secret',
    });

    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const exitSpy = vi
      .spyOn(process, 'exit')
      .mockImplementation((code?: number | string | null): never => {
        throw new Error(`process.exit:${String(code ?? '')}`);
      });

    await expect(import('./env.js')).rejects.toThrow('process.exit:1');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalledWith('Invalid environment variables:');
  });
});
