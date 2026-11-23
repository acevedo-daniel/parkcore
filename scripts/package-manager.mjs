import { existsSync } from 'node:fs';
import path from 'node:path';

export function resolvePackageManager() {
  if (process.platform !== 'win32') return 'pnpm';
  for (const directory of (process.env.PATH ?? '').split(path.delimiter)) {
    const executable = path.join(directory, 'node_modules', 'pnpm', 'pnpm.exe');
    if (existsSync(executable)) return executable;
  }
  return 'pnpm.cmd';
}
