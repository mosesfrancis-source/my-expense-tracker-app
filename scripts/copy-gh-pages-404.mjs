import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const candidates = [
  resolve('dist/expense-tracker/browser/index.html'),
  resolve('dist/expense-tracker/browser/index.csr.html'),
];

const source = candidates.find((candidate) => existsSync(candidate));
const target = resolve('dist/expense-tracker/browser/404.html');

if (!source) {
  console.error(`Source file not found: ${candidates.join(', ')}`);
  process.exit(1);
}

copyFileSync(source, target);
console.log(`Copied ${source} -> ${target}`);
