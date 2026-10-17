#!/usr/bin/env node
import { cpSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

/**
 * Creates a new project from this template.
 *
 * Usage: npm run create:project -- <project-name> [--target <directory>] [--title "<title>"] [--description "<text>"]
 */

const TEMPLATE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEMPLATE_NAME = 'nest-hexagonal-template';
const TEMPLATE_TITLE = 'Nest Hexagonal Template';
const TEMPLATE_DESCRIPTION = 'NestJS + Fastify service following a hexagonal, functional DDD architecture.';
const EXCLUDED_ENTRIES = new Set(['node_modules', 'dist', 'coverage', '.git', '.env', 'package-lock.json']);
const FILES_TO_RENAME = ['package.json', 'README.md', 'src/app.metadata.ts'];

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const toTitle = (kebabName) =>
  kebabName
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    target: { type: 'string' },
    title: { type: 'string' },
    description: { type: 'string' },
  },
});

const [projectName] = positionals;

if (!projectName) {
  fail('Usage: npm run create:project -- <project-name> [--target <directory>] [--title "<title>"]');
}

if (!/^[a-z][a-z0-9-]*$/.test(projectName)) {
  fail(`"${projectName}" is not a valid project name. Use lowercase kebab-case, e.g. "billing-service".`);
}

const targetDirectory = path.resolve(values.target ?? path.join(TEMPLATE_ROOT, '..', projectName));
const title = values.title ?? toTitle(projectName);
const description = values.description ?? TEMPLATE_DESCRIPTION;

if (existsSync(targetDirectory)) {
  fail(`The target directory already exists: ${targetDirectory}`);
}

cpSync(TEMPLATE_ROOT, targetDirectory, {
  recursive: true,
  filter: (source) => !EXCLUDED_ENTRIES.has(path.basename(source)),
});

for (const relativePath of FILES_TO_RENAME) {
  const filePath = path.join(targetDirectory, relativePath);
  const content = readFileSync(filePath, 'utf-8')
    .replaceAll(TEMPLATE_DESCRIPTION, description)
    .replaceAll(TEMPLATE_TITLE, title)
    .replaceAll(TEMPLATE_NAME, projectName);
  writeFileSync(filePath, content);
}

const packageJsonPath = path.join(targetDirectory, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
packageJson.version = '0.1.0';
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);

console.log(`✔ Project "${projectName}" created in ${targetDirectory}`);
console.log('\nNext steps:');
console.log(`  cd "${targetDirectory}"`);
console.log('  git init');
console.log('  npm install');
console.log('  cp .env.example .env');
console.log('  npm run generate:feature -- <feature-name>');
console.log('  npm run start:dev');
