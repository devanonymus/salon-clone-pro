import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsRoot = fileURLToPath(
  new URL('../apps/api/prisma/migrations/', import.meta.url),
);
const overrideMarker = 'allow-destructive-migration: reviewed';
const forbiddenStatements = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+COLUMN\b/i,
  /\bTRUNCATE(?:\s+TABLE)?\b/i,
  /\bDELETE\s+FROM\b/i,
];

async function sqlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await sqlFiles(path)));
    } else if (entry.isFile() && extname(entry.name) === '.sql') {
      files.push(path);
    }
  }
  return files;
}

function withoutComments(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');
}

const files = await sqlFiles(migrationsRoot);
if (files.length === 0) throw new Error('Nessuna migration SQL trovata');

const violations = [];
for (const file of files) {
  const sql = await readFile(file, 'utf8');
  if (sql.toLowerCase().includes(overrideMarker)) continue;
  const executableSql = withoutComments(sql);
  const matches = forbiddenStatements
    .filter((pattern) => pattern.test(executableSql))
    .map((pattern) => pattern.source);
  if (matches.length > 0) {
    violations.push({ file: relative(process.cwd(), file), patterns: matches });
  }
}

if (violations.length > 0) {
  console.error(
    'Migration potenzialmente distruttiva. Richiede revisione esplicita:',
  );
  for (const violation of violations) {
    console.error(`- ${violation.file}: ${violation.patterns.join(', ')}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Migration check superato: ${files.length} file SQL verificati.`);
}
