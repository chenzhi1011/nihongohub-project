import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const generated = execFileSync(
  'npx',
  ['supabase', 'gen', 'types', 'typescript', '--local', '--schema', 'public', '--log-level', 'error'],
  { encoding: 'utf8' },
);
const typeStart = generated.indexOf('export type Json');

if (typeStart < 0) {
  throw new Error('Supabase CLI output did not contain generated TypeScript definitions');
}

writeFileSync(new URL('../src/types/database.ts', import.meta.url), `${generated.slice(typeStart).trimEnd()}\n`);
