import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const requireFromWeb = createRequire(new URL('../apps/web/package.json', import.meta.url));
const { ESLint } = requireFromWeb('eslint');
const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = path.join(repositoryRoot, 'apps', 'web');
const rawInteractiveElements = '<button /><input /><select /><textarea /><dialog />';
const expectedMessage =
  'Compose a primitive from components/ui instead of a raw interactive element.';

const eslint = new ESLint({ cwd: webRoot });

async function restrictedSyntaxMessages(source, relativePath) {
  const [result] = await eslint.lintText(source, {
    filePath: path.join(webRoot, relativePath),
  });

  return result.messages.filter(({ ruleId }) => ruleId === 'no-restricted-syntax');
}

test('rejects raw interactive elements outside the primitive layer', async () => {
  const pageMessages = await restrictedSyntaxMessages(
    `export function Fixture() { return <>${rawInteractiveElements}</>; }`,
    'src/routes/public/landing-route.tsx',
  );
  assert.equal(pageMessages.length, 5);
  assert.deepEqual(
    pageMessages.map(({ message }) => message),
    Array(5).fill(expectedMessage),
  );

  const primitiveMessages = await restrictedSyntaxMessages(
    `export function Fixture() { return <>${rawInteractiveElements}</>; }`,
    'src/components/ui/button.tsx',
  );
  assert.deepEqual(primitiveMessages, []);

  const compositionMessages = await restrictedSyntaxMessages(
    "import { Button } from '@/components/ui/button'; export function Fixture() { return <Button>Save</Button>; }",
    'src/routes/public/landing-route.tsx',
  );
  assert.deepEqual(compositionMessages, []);
});
