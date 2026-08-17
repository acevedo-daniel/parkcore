import { z } from 'zod';

const parseCorsOrigins = (value: string | undefined): string[] =>
  value?.split(',').map((origin) => origin.trim()) ?? [];

const isHttpOrigin = (value: string): boolean => {
  try {
    const url = new URL(value);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === value;
  } catch {
    return false;
  }
};

const envBooleanSchema = z
  .preprocess(
    (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value),
    z.union([z.boolean(), z.enum(['true', 'false'])]),
  )
  .transform((value) => value === true || value === 'true');

const envSchema = z
  .object({
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    LOG_PRETTY: envBooleanSchema.default(false),
    NODE_ENV: z
      .enum(['development', 'production', 'test'], { error: 'Invalid NODE_ENV' })
      .default('development'),
    PORT: z.coerce.number({ error: 'Invalid PORT' }).default(3000),
    ENABLE_API_DOCS: envBooleanSchema.default(false),
    CORS_ORIGINS: z.string().optional(),
    DATABASE_URL: z.string({ error: 'Required' }).min(1, { error: 'Required' }),
    JWT_SECRET: z.string({ error: 'Required' }).min(32, { error: 'Min 32 chars' }),
    JWT_EXPIRES_IN: z.string({ error: 'Required' }).default('24h'),
    AUTH_RATE_LIMIT_MAX: z.coerce
      .number({ error: 'Invalid AUTH_RATE_LIMIT_MAX' })
      .int()
      .positive()
      .default(15),
    AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
      .number({ error: 'Invalid AUTH_RATE_LIMIT_WINDOW_MS' })
      .int()
      .positive()
      .default(15 * 60 * 1000),
  })
  .superRefine((value, ctx) => {
    const corsOrigins = parseCorsOrigins(value.CORS_ORIGINS);

    if (value.CORS_ORIGINS !== undefined && corsOrigins.some((origin) => !isHttpOrigin(origin))) {
      ctx.addIssue({
        code: 'custom',
        path: ['CORS_ORIGINS'],
        message: 'Must be comma-separated HTTP(S) origins without paths or trailing slashes',
      });
    }
    if (value.NODE_ENV === 'production' && corsOrigins.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['CORS_ORIGINS'], message: 'Required in production' });
    }
  })
  .transform((value) => ({
    ...value,
    CORS_ORIGINS: parseCorsOrigins(value.CORS_ORIGINS),
  }));

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export type Env = z.infer<typeof envSchema>;

export const env: Env = parsed.data;
