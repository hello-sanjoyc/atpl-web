import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildApp } from '../app.js';
import { loadConfig } from '../config/env.js';
import { createContainer } from '../container.js';

/** Writes the OpenAPI 3.1 document generated from the route schemas to docs/openapi.json. */
async function main(): Promise<void> {
  const config = loadConfig();
  const container = createContainer(config);
  const app = await buildApp(container);
  try {
    await app.ready();
    const document = app.swagger();
    const target = resolve(process.cwd(), 'docs/openapi.json');
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
    process.stdout.write(`OpenAPI document written to ${target}\n`);
  } finally {
    await app.close();
    await container.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`OpenAPI export failed: ${(error as Error).message}\n`);
  process.exit(1);
});
