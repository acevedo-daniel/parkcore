import { generateOpenApiDocument } from '../config/openapi.js';

const document = generateOpenApiDocument();
console.log(JSON.stringify(document, null, 2));
