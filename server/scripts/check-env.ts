import { readFileSync } from 'fs';
import { readdirSync, statSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const exampleEnv = readFileSync(resolve(__dirname, '../.env.example'), 'utf-8');

const documentedVars = new Set(
  exampleEnv
    .split('\n')
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.split('=')[0].trim())
    .filter(Boolean)
);

const getAllTsFiles = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...getAllTsFiles(full));
    } else if (full.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
};

const srcDir = resolve(__dirname, '../src');
const tsFiles = getAllTsFiles(srcDir);

const usedVars = new Set<string>();
const envVarRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;

for (const file of tsFiles) {
  const content = readFileSync(file, 'utf-8');
  for (const match of content.matchAll(envVarRegex)) {
    usedVars.add(match[1]);
  }
}

const STANDARD_NODE_VARS = new Set(['PORT', 'NODE_ENV']);

const undocumented = [...usedVars].filter(
  (key) => !documentedVars.has(key) && !STANDARD_NODE_VARS.has(key)
);

if (undocumented.length > 0) {
  console.error('Environment variables used in code but missing from .env.example:');
  undocumented.forEach((key) => console.error(`  - ${key}`));
  process.exit(1);
}

console.log('All environment variables are documented in .env.example.');
