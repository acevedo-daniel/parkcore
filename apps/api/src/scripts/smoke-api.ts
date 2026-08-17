type JsonRecord = Record<string, unknown>;

interface HttpResult {
  status: number;
  json: JsonRecord | null;
}

const baseUrl = (process.env.SMOKE_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
const withAuth = process.env.SMOKE_WITH_AUTH === 'true';
const timeoutMs = Number.parseInt(process.env.SMOKE_TIMEOUT_MS ?? '30000', 10);
const maxRetries = Number.parseInt(process.env.SMOKE_RETRIES ?? '2', 10);

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

async function requestJson(path: string, init?: RequestInit): Promise<HttpResult> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const headers = new Headers(init?.headers);
      headers.set('content-type', 'application/json');

      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers,
      });

      let json: JsonRecord | null = null;
      try {
        json = (await response.json()) as JsonRecord;
      } catch {
        json = null;
      }

      return { status: response.status, json };
    } catch (error) {
      lastError = error;
      if (attempt > maxRetries) {
        throw error;
      }
      console.warn(`Request retry ${String(attempt)}/${String(maxRetries)} for ${path}`);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
}

async function checkHealth(): Promise<void> {
  const result = await requestJson('/healthz');
  assert(result.status === 200, `GET /healthz expected 200, got ${String(result.status)}`);
  assert(result.json?.status === 'ok', 'GET /healthz expected body.status === "ok"');
}

async function checkDocs(): Promise<void> {
  const docsPaths = ['/openapi.json', '/api-docs/openapi.json'];
  let result: HttpResult | null = null;

  for (const path of docsPaths) {
    const candidate = await requestJson(path);
    if (candidate.status === 200) {
      result = candidate;
      break;
    }
  }

  assert(
    result !== null,
    'OpenAPI endpoint not reachable (checked /openapi.json and /api-docs/openapi.json)',
  );
  const json = result.json;
  assert(json !== null, 'OpenAPI document body is not JSON');
  assert(typeof json.openapi === 'string', 'OpenAPI document missing "openapi" field');
  assert(typeof json.info === 'object', 'OpenAPI document missing "info" field');
}

async function checkAuthFlow(): Promise<void> {
  const email = `smoke-${String(Date.now())}@parkcore.test`;
  const password = 'Passw0rd!123';

  const register = await requestJson('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      name: 'Smoke User',
    }),
  });

  assert(
    register.status === 201 || register.status === 409,
    `POST /auth/register expected 201 or 409, got ${String(register.status)}`,
  );

  const login = await requestJson('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  assert(login.status === 200, `POST /auth/login expected 200, got ${String(login.status)}`);
  assert(
    typeof login.json?.accessToken === 'string' && login.json.accessToken.length > 20,
    'POST /auth/login did not return a valid accessToken',
  );
}

async function main(): Promise<void> {
  console.log(`Smoke check target: ${baseUrl}`);
  await checkHealth();
  await checkDocs();

  if (withAuth) {
    await checkAuthFlow();
  }

  console.log(
    `Smoke check passed (${withAuth ? 'health + docs + auth' : 'health + docs'}). Base URL: ${baseUrl}`,
  );
}

void main().catch((error: unknown) => {
  console.error('Smoke check failed');
  console.error(error);
  process.exit(1);
});
