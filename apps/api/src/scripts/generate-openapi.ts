import { writeFile } from 'node:fs/promises';

import { generateOpenApiDocument } from '../config/openapi.js';

const document = generateOpenApiDocument();
const output = new URL('../../openapi.json', import.meta.url);

await writeFile(output, `${JSON.stringify(document, null, 2)}\n`);
console.log(`OpenAPI document written to ${output.pathname}`);
