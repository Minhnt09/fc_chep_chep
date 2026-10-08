import { createRequire } from 'node:module';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';

// Dùng compiler bundling đã đi kèm Angular build, không cần thêm dependency cho test.
const requireBuild = createRequire(resolve('node_modules/@angular/build/package.json'));
const { build } = requireBuild('esbuild');
const directory = await mkdtemp(join(tmpdir(), 'fc-interactions-tests-'));
try {
  const outfile = join(directory, 'interactions.test.mjs');
  await build({ entryPoints: ['tests/interactions.service.test.ts'], outfile, bundle: true, platform: 'node', format: 'esm', target: 'node20', logLevel: 'warning' });
  const result = spawnSync(process.execPath, [outfile], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally { await rm(directory, { recursive: true, force: true }); }
