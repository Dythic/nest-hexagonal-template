#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

/**
 * Scaffolds a complete vertical slice (domain, application, inbound API, Firestore adapter, module and tests)
 * following the hexagonal rules described in GEMINI.md.
 *
 * Usage: npm run generate:feature -- <feature-name> [--plural <plural-name>] [--force]
 */

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RESERVED_NAMES = new Set(['app', 'health', 'config', 'logging']);

const fail = (message) => {
  console.error(`✖ ${message}`);
  process.exit(1);
};

const pluralise = (word) => {
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  if (/(s|x|z|ch|sh)$/.test(word)) return `${word}es`;
  return `${word}s`;
};

const toPascal = (kebab) =>
  kebab
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

const toCamel = (kebab) => {
  const pascal = toPascal(kebab);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
};

const capitalise = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    plural: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
});

const [kebab] = positionals;

if (!kebab) {
  fail('Usage: npm run generate:feature -- <feature-name> [--plural <plural-name>] [--force]');
}

if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(kebab)) {
  fail(`"${kebab}" is not a valid feature name. Use singular lowercase kebab-case, e.g. "purchase-order".`);
}

if (RESERVED_NAMES.has(kebab)) {
  fail(`"${kebab}" is a reserved name.`);
}

const segments = kebab.split('-');
const pluralKebab = values.plural ?? [...segments.slice(0, -1), pluralise(segments.at(-1))].join('-');

if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(pluralKebab) || pluralKebab === kebab) {
  fail(`"${pluralKebab}" is not a valid plural name.`);
}

const n = {
  kebab,
  pascal: toPascal(kebab),
  camel: toCamel(kebab),
  words: segments.join(' '),
  Words: capitalise(segments.join(' ')),
  pluralKebab,
  pluralPascal: toPascal(pluralKebab),
  pluralTitle: pluralKebab
    .split('-')
    .map((word) => capitalise(word))
    .join(' '),
  collection: pluralKebab.replaceAll('-', '_'),
};

const files = {
  [`src/domain/models/${n.kebab}.model.ts`]: `import { z } from 'zod';

export const ${n.pascal}Schema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(255),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ${n.pascal} = Readonly<z.infer<typeof ${n.pascal}Schema>>;

export const ${n.pascal}PropsSchema = ${n.pascal}Schema.omit({ id: true, createdAt: true, updatedAt: true });

export type ${n.pascal}Props = Readonly<z.infer<typeof ${n.pascal}PropsSchema>>;

export const Unsaved${n.pascal}Schema = ${n.pascal}PropsSchema.brand<'Unsaved${n.pascal}'>();

export type Unsaved${n.pascal} = Readonly<z.infer<typeof Unsaved${n.pascal}Schema>>;
`,

  [`src/domain/models/${n.kebab}.factory.ts`]: `import { BusinessRuleViolationError } from '@domain/errors/business-rule-violation.error.js';
import { prettifyError } from 'zod';
import { ${n.pascal}Props, Unsaved${n.pascal}, Unsaved${n.pascal}Schema } from './${n.kebab}.model.js';

export const ${n.pascal}Factory = {
  /**
   * Validates the business invariants of a ${n.words} and returns it ready to be persisted.
   * @throws BusinessRuleViolationError when an invariant is broken.
   */
  create: (props: ${n.pascal}Props): Unsaved${n.pascal} => {
    const result = Unsaved${n.pascal}Schema.safeParse(props);

    if (!result.success) {
      throw new BusinessRuleViolationError(\`Invalid ${n.words}: \${prettifyError(result.error)}\`);
    }

    return result.data;
  },
};
`,

  [`src/domain/ports/${n.kebab}-persistence.port.ts`]: `import { ${n.pascal}, Unsaved${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { Paginated, Pagination } from '@domain/models/pagination.model.js';

export abstract class ${n.pascal}Persistence {
  abstract save(${n.camel}: Unsaved${n.pascal}): Promise<${n.pascal}>;
  abstract findById(id: string): Promise<${n.pascal} | null>;
  abstract findAll(pagination: Pagination): Promise<Paginated<${n.pascal}>>;
}
`,

  [`src/application/use-cases/create-${n.kebab}.use-case.ts`]: `import { ${n.pascal}Factory } from '@domain/models/${n.kebab}.factory.js';
import { ${n.pascal}, ${n.pascal}Props } from '@domain/models/${n.kebab}.model.js';
import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Create${n.pascal}UseCase {
  constructor(private readonly ${n.camel}Persistence: ${n.pascal}Persistence) {}

  execute(props: ${n.pascal}Props): Promise<${n.pascal}> {
    const unsaved${n.pascal} = ${n.pascal}Factory.create(props);
    return this.${n.camel}Persistence.save(unsaved${n.pascal});
  }
}
`,

  [`src/application/use-cases/get-${n.kebab}.use-case.ts`]: `import { ItemNotFoundError } from '@domain/errors/item-not-found.error.js';
import { ${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class Get${n.pascal}UseCase {
  constructor(private readonly ${n.camel}Persistence: ${n.pascal}Persistence) {}

  async execute(id: string): Promise<${n.pascal}> {
    const ${n.camel} = await this.${n.camel}Persistence.findById(id);

    if (!${n.camel}) {
      throw new ItemNotFoundError(\`${n.Words} '\${id}' not found.\`);
    }

    return ${n.camel};
  }
}
`,

  [`src/application/use-cases/list-${n.pluralKebab}.use-case.ts`]: `import { ${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { Paginated, Pagination } from '@domain/models/pagination.model.js';
import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class List${n.pluralPascal}UseCase {
  constructor(private readonly ${n.camel}Persistence: ${n.pascal}Persistence) {}

  execute(pagination: Pagination): Promise<Paginated<${n.pascal}>> {
    return this.${n.camel}Persistence.findAll(pagination);
  }
}
`,

  [`src/infrastructure/inbound/api/dto/create-${n.kebab}-request.dto.ts`]: `import { ${n.pascal}Props } from '@domain/models/${n.kebab}.model.js';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const Create${n.pascal}RequestSchema = z.object({
  name: z.string().describe('Display name of the ${n.words}.'),
});

export type Create${n.pascal}Request = Readonly<z.infer<typeof Create${n.pascal}RequestSchema>>;

export class Create${n.pascal}RequestDto extends createZodDto(Create${n.pascal}RequestSchema) {}

export const toCreate${n.pascal}Props = (request: Create${n.pascal}Request): ${n.pascal}Props => ({
  name: request.name,
});
`,

  [`src/infrastructure/inbound/api/dto/${n.kebab}-response.dto.ts`]: `import { ${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { Paginated } from '@domain/models/pagination.model.js';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { createPaginatedResponseSchema } from './paginated-response.dto.js';

export const ${n.pascal}ResponseSchema = z.object({
  id: z.string().describe('Unique identifier.'),
  name: z.string().describe('Display name.'),
  createdAt: z.iso.datetime().describe('Creation date (ISO 8601).'),
  updatedAt: z.iso.datetime().describe('Last update date (ISO 8601).'),
});

export type ${n.pascal}Response = z.infer<typeof ${n.pascal}ResponseSchema>;

export class ${n.pascal}ResponseDto extends createZodDto(${n.pascal}ResponseSchema) {}

export const ${n.pascal}PageResponseSchema = createPaginatedResponseSchema(${n.pascal}ResponseSchema);

export type ${n.pascal}PageResponse = z.infer<typeof ${n.pascal}PageResponseSchema>;

export class ${n.pascal}PageResponseDto extends createZodDto(${n.pascal}PageResponseSchema) {}

export const to${n.pascal}Response = (${n.camel}: ${n.pascal}): ${n.pascal}Response =>
  ${n.pascal}ResponseSchema.parse({
    id: ${n.camel}.id,
    name: ${n.camel}.name,
    createdAt: ${n.camel}.createdAt.toISOString(),
    updatedAt: ${n.camel}.updatedAt.toISOString(),
  });

export const to${n.pascal}PageResponse = (page: Paginated<${n.pascal}>): ${n.pascal}PageResponse =>
  ${n.pascal}PageResponseSchema.parse({
    ...page,
    items: page.items.map(to${n.pascal}Response),
  });
`,

  [`src/infrastructure/inbound/api/${n.kebab}.controller.ts`]: `import { Create${n.pascal}UseCase } from '@application/use-cases/create-${n.kebab}.use-case.js';
import { Get${n.pascal}UseCase } from '@application/use-cases/get-${n.kebab}.use-case.js';
import { List${n.pluralPascal}UseCase } from '@application/use-cases/list-${n.pluralKebab}.use-case.js';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiStandardResponses } from './decorators/api-standard-responses.decorator.js';
import { Create${n.pascal}RequestDto, toCreate${n.pascal}Props } from './dto/create-${n.kebab}-request.dto.js';
import {
  ${n.pascal}PageResponse,
  ${n.pascal}PageResponseDto,
  ${n.pascal}Response,
  ${n.pascal}ResponseDto,
  to${n.pascal}PageResponse,
  to${n.pascal}Response,
} from './dto/${n.kebab}-response.dto.js';
import { PaginationRequestDto, toPagination } from './dto/pagination-request.dto.js';

@ApiTags('${n.pluralTitle}')
@Controller('${n.pluralKebab}')
export class ${n.pascal}Controller {
  constructor(
    private readonly create${n.pascal}UseCase: Create${n.pascal}UseCase,
    private readonly get${n.pascal}UseCase: Get${n.pascal}UseCase,
    private readonly list${n.pluralPascal}UseCase: List${n.pluralPascal}UseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a ${n.words}' })
  @ApiStandardResponses({ type: ${n.pascal}ResponseDto, status: HttpStatus.CREATED })
  async create(@Body() request: Create${n.pascal}RequestDto): Promise<${n.pascal}Response> {
    const ${n.camel} = await this.create${n.pascal}UseCase.execute(toCreate${n.pascal}Props(request));
    return to${n.pascal}Response(${n.camel});
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a ${n.words} by its identifier' })
  @ApiStandardResponses({ type: ${n.pascal}ResponseDto })
  async findOne(@Param('id') id: string): Promise<${n.pascal}Response> {
    const ${n.camel} = await this.get${n.pascal}UseCase.execute(id);
    return to${n.pascal}Response(${n.camel});
  }

  @Get()
  @ApiOperation({ summary: 'List ${n.pluralTitle.toLowerCase()}' })
  @ApiStandardResponses({ type: ${n.pascal}PageResponseDto })
  async findAll(@Query() query: PaginationRequestDto): Promise<${n.pascal}PageResponse> {
    const page = await this.list${n.pluralPascal}UseCase.execute(toPagination(query));
    return to${n.pascal}PageResponse(page);
  }
}
`,

  [`src/infrastructure/outbound/persistence/firestore/entities/${n.kebab}.document.ts`]: `import { z } from 'zod';
import { BaseDocumentSchema } from './base.document.js';

export const ${n.pascal}DocumentSchema = BaseDocumentSchema.extend({
  name: z.string(),
});

export type ${n.pascal}Document = z.infer<typeof ${n.pascal}DocumentSchema>;
`,

  [`src/infrastructure/outbound/persistence/firestore/mappers/${n.kebab}.mapper.ts`]: `import { ${n.pascal}, ${n.pascal}Schema, Unsaved${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { ${n.pascal}Document } from '../entities/${n.kebab}.document.js';

export const ${n.pascal}Mapper = {
  toDocument: (${n.camel}: Unsaved${n.pascal}, id: string, now: Date): ${n.pascal}Document => ({
    id,
    name: ${n.camel}.name,
    createdAt: now,
    updatedAt: now,
  }),

  toDomain: (document: ${n.pascal}Document): ${n.pascal} => ${n.pascal}Schema.parse(document),
};
`,

  [`src/infrastructure/outbound/persistence/firestore/adapters/${n.kebab}-firestore.adapter.ts`]: `import { ${n.pascal}, Unsaved${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { Paginated, PaginatedFactory, Pagination } from '@domain/models/pagination.model.js';
import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';
import { Injectable } from '@nestjs/common';
import { CollectionReference } from 'firebase-admin/firestore';
import { ${n.pascal}Document, ${n.pascal}DocumentSchema } from '../entities/${n.kebab}.document.js';
import { FirestoreClient } from '../firestore.client.js';
import { ${n.pascal}Mapper } from '../mappers/${n.kebab}.mapper.js';
import { firestoreZodConverter } from '../utils/firestore-zod.converter.js';

const COLLECTION_NAME = '${n.collection}';

@Injectable()
export class ${n.pascal}FirestoreAdapter implements ${n.pascal}Persistence {
  constructor(private readonly firestoreClient: FirestoreClient) {}

  private get collection(): CollectionReference<${n.pascal}Document> {
    return this.firestoreClient.db
      .collection(COLLECTION_NAME)
      .withConverter(firestoreZodConverter(${n.pascal}DocumentSchema));
  }

  async save(${n.camel}: Unsaved${n.pascal}): Promise<${n.pascal}> {
    const documentRef = this.collection.doc();
    const document = ${n.pascal}Mapper.toDocument(${n.camel}, documentRef.id, new Date());

    await documentRef.set(document);

    return ${n.pascal}Mapper.toDomain(document);
  }

  async findById(id: string): Promise<${n.pascal} | null> {
    const snapshot = await this.collection.doc(id).get();
    const document = snapshot.data();

    return document ? ${n.pascal}Mapper.toDomain(document) : null;
  }

  async findAll(pagination: Pagination): Promise<Paginated<${n.pascal}>> {
    const [countSnapshot, pageSnapshot] = await Promise.all([
      this.collection.count().get(),
      this.collection
        .orderBy('createdAt', pagination.sortOrder)
        .offset(PaginatedFactory.offsetOf(pagination))
        .limit(pagination.itemsPerPage)
        .get(),
    ]);

    const items = pageSnapshot.docs.map((snapshot) => ${n.pascal}Mapper.toDomain(snapshot.data()));

    return PaginatedFactory.create(items, pagination, countSnapshot.data().count);
  }
}
`,

  [`src/${n.kebab}.module.ts`]: `import { Create${n.pascal}UseCase } from '@application/use-cases/create-${n.kebab}.use-case.js';
import { Get${n.pascal}UseCase } from '@application/use-cases/get-${n.kebab}.use-case.js';
import { List${n.pluralPascal}UseCase } from '@application/use-cases/list-${n.pluralKebab}.use-case.js';
import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';
import { ${n.pascal}Controller } from '@infrastructure/inbound/api/${n.kebab}.controller.js';
import { ${n.pascal}FirestoreAdapter } from '@infrastructure/outbound/persistence/firestore/adapters/${n.kebab}-firestore.adapter.js';
import { FirestoreModule } from '@infrastructure/outbound/persistence/firestore/firestore.module.js';
import { Module } from '@nestjs/common';

@Module({
  imports: [FirestoreModule],
  controllers: [${n.pascal}Controller],
  providers: [
    Create${n.pascal}UseCase,
    Get${n.pascal}UseCase,
    List${n.pluralPascal}UseCase,
    { provide: ${n.pascal}Persistence, useClass: ${n.pascal}FirestoreAdapter },
  ],
})
export class ${n.pascal}Module {}
`,

  [`test/support/in-memory-${n.kebab}.persistence.ts`]: `import { randomUUID } from 'node:crypto';
import { ${n.pascal}, Unsaved${n.pascal} } from '@domain/models/${n.kebab}.model.js';
import { Paginated, PaginatedFactory, Pagination } from '@domain/models/pagination.model.js';
import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';

export class InMemory${n.pascal}Persistence implements ${n.pascal}Persistence {
  private readonly store = new Map<string, ${n.pascal}>();

  save(${n.camel}: Unsaved${n.pascal}): Promise<${n.pascal}> {
    const now = new Date();
    const saved: ${n.pascal} = { id: randomUUID(), name: ${n.camel}.name, createdAt: now, updatedAt: now };
    this.store.set(saved.id, saved);
    return Promise.resolve(saved);
  }

  findById(id: string): Promise<${n.pascal} | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findAll(pagination: Pagination): Promise<Paginated<${n.pascal}>> {
    const direction = pagination.sortOrder === 'asc' ? 1 : -1;
    const sorted = [...this.store.values()].sort(
      (left, right) => direction * (left.createdAt.getTime() - right.createdAt.getTime()),
    );
    const offset = PaginatedFactory.offsetOf(pagination);
    const items = sorted.slice(offset, offset + pagination.itemsPerPage);

    return Promise.resolve(PaginatedFactory.create(items, pagination, sorted.length));
  }
}
`,

  [`test/unit/domain/models/${n.kebab}.factory.spec.ts`]: `import { BusinessRuleViolationError } from '@domain/errors/business-rule-violation.error.js';
import { ${n.pascal}Factory } from '@domain/models/${n.kebab}.factory.js';
import { describe, expect, it } from 'vitest';

describe('${n.pascal}Factory', () => {
  it('creates an unsaved ${n.words} from valid props', () => {
    expect(${n.pascal}Factory.create({ name: '  Example  ' })).toEqual({ name: 'Example' });
  });

  it('rejects a blank name', () => {
    expect(() => ${n.pascal}Factory.create({ name: '   ' })).toThrow(BusinessRuleViolationError);
  });

  it('rejects a name that is too long', () => {
    expect(() => ${n.pascal}Factory.create({ name: 'x'.repeat(256) })).toThrow(BusinessRuleViolationError);
  });
});
`,

  [`test/unit/application/use-cases/${n.kebab}.use-cases.spec.ts`]: `import { Create${n.pascal}UseCase } from '@application/use-cases/create-${n.kebab}.use-case.js';
import { Get${n.pascal}UseCase } from '@application/use-cases/get-${n.kebab}.use-case.js';
import { List${n.pluralPascal}UseCase } from '@application/use-cases/list-${n.pluralKebab}.use-case.js';
import { BusinessRuleViolationError } from '@domain/errors/business-rule-violation.error.js';
import { ItemNotFoundError } from '@domain/errors/item-not-found.error.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { InMemory${n.pascal}Persistence } from '../../../support/in-memory-${n.kebab}.persistence.js';

describe('${n.pascal} use cases', () => {
  let persistence: InMemory${n.pascal}Persistence;

  beforeEach(() => {
    persistence = new InMemory${n.pascal}Persistence();
  });

  it('creates and persists a ${n.words}', async () => {
    const created = await new Create${n.pascal}UseCase(persistence).execute({ name: 'Example' });

    expect(created).toMatchObject({ name: 'Example' });
    expect(created.id).toEqual(expect.any(String));
    await expect(persistence.findById(created.id)).resolves.toEqual(created);
  });

  it('does not persist a ${n.words} breaking a business rule', async () => {
    expect(() => new Create${n.pascal}UseCase(persistence).execute({ name: '' })).toThrow(BusinessRuleViolationError);
    await expect(persistence.findAll({ page: 1, itemsPerPage: 10, sortOrder: 'asc' })).resolves.toMatchObject({
      totalItems: 0,
    });
  });

  it('gets an existing ${n.words}', async () => {
    const created = await new Create${n.pascal}UseCase(persistence).execute({ name: 'Example' });

    await expect(new Get${n.pascal}UseCase(persistence).execute(created.id)).resolves.toEqual(created);
  });

  it('fails when the ${n.words} does not exist', async () => {
    await expect(new Get${n.pascal}UseCase(persistence).execute('unknown')).rejects.toThrow(ItemNotFoundError);
  });

  it('lists ${n.pluralTitle.toLowerCase()} page by page', async () => {
    const create = new Create${n.pascal}UseCase(persistence);
    await create.execute({ name: 'First' });
    await create.execute({ name: 'Second' });
    await create.execute({ name: 'Third' });

    const page = await new List${n.pluralPascal}UseCase(persistence).execute({ page: 2, itemsPerPage: 2, sortOrder: 'asc' });

    expect(page).toMatchObject({ page: 2, itemsPerPage: 2, totalItems: 3, totalPages: 2 });
    expect(page.items).toHaveLength(1);
  });
});
`,

  [`test/e2e/${n.kebab}.e2e-spec.ts`]: `import { ${n.pascal}Persistence } from '@domain/ports/${n.kebab}-persistence.port.js';
import { FirestoreClient } from '@infrastructure/outbound/persistence/firestore/firestore.client.js';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { TestingModuleBuilder } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from '../support/create-test-app.js';
import { InMemory${n.pascal}Persistence } from '../support/in-memory-${n.kebab}.persistence.js';

describe('${n.pascal} API (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp(
      (builder: TestingModuleBuilder): TestingModuleBuilder =>
        builder
          .overrideProvider(FirestoreClient)
          .useValue({})
          .overrideProvider(${n.pascal}Persistence)
          .useValue(new InMemory${n.pascal}Persistence()),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /${n.pluralKebab} creates a ${n.words}', async () => {
    const response = await app.inject({ method: 'POST', url: '/${n.pluralKebab}', payload: { name: 'Example' } });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ name: 'Example', id: expect.any(String) as string });
  });

  it('POST /${n.pluralKebab} rejects a malformed request', async () => {
    const response = await app.inject({ method: 'POST', url: '/${n.pluralKebab}', payload: {} });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ message: 'Validation failed', details: [{ field: 'name' }] });
  });

  it('POST /${n.pluralKebab} rejects a request breaking a business rule', async () => {
    const response = await app.inject({ method: 'POST', url: '/${n.pluralKebab}', payload: { name: '   ' } });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: 'Bad Request', details: null });
  });

  it('GET /${n.pluralKebab}/:id returns an existing ${n.words}', async () => {
    const created = await app.inject({ method: 'POST', url: '/${n.pluralKebab}', payload: { name: 'Lookup' } });
    const { id } = created.json<{ id: string }>();

    const response = await app.inject({ method: 'GET', url: \`/${n.pluralKebab}/\${id}\` });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ id, name: 'Lookup' });
  });

  it('GET /${n.pluralKebab}/:id returns 404 for an unknown ${n.words}', async () => {
    const response = await app.inject({ method: 'GET', url: '/${n.pluralKebab}/unknown' });

    expect(response.statusCode).toBe(404);
  });

  it('GET /${n.pluralKebab} lists ${n.pluralTitle.toLowerCase()}', async () => {
    const response = await app.inject({ method: 'GET', url: '/${n.pluralKebab}?page=1&itemsPerPage=10' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ page: 1, itemsPerPage: 10 });
  });
});
`,
};

const existing = Object.keys(files).filter((relativePath) => existsSync(path.join(PROJECT_ROOT, relativePath)));

if (existing.length > 0 && !values.force) {
  fail(`These files already exist (use --force to overwrite):\n  ${existing.join('\n  ')}`);
}

for (const [relativePath, content] of Object.entries(files)) {
  const filePath = path.join(PROJECT_ROOT, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, content);
  console.log(`  created ${relativePath}`);
}

const registerModule = () => {
  const appModulePath = path.join(PROJECT_ROOT, 'src/app.module.ts');
  const moduleName = `${n.pascal}Module`;
  const importLine = `import { ${moduleName} } from './${n.kebab}.module.js';`;
  let content = readFileSync(appModulePath, 'utf-8');

  if (content.includes(importLine)) {
    return true;
  }

  const lastImport = [...content.matchAll(/^import [^;]+;$/gm)].at(-1);
  const importsArray = /imports:\s*\[([^\]]*)\]/;

  if (!lastImport || !importsArray.test(content)) {
    return false;
  }

  const insertAt = lastImport.index + lastImport[0].length;
  content = `${content.slice(0, insertAt)}\n${importLine}${content.slice(insertAt)}`;
  content = content.replace(importsArray, (_match, list) => {
    const modules = list
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    return `imports: [${[...modules, moduleName].join(', ')}]`;
  });

  writeFileSync(appModulePath, content);
  return true;
};

if (registerModule()) {
  console.log(`  updated src/app.module.ts (registered ${n.pascal}Module)`);
} else {
  console.warn(`⚠ Could not update src/app.module.ts automatically: import ${n.pascal}Module manually.`);
}

console.log(`\n✔ Feature "${n.kebab}" generated. Run "npm run format && npm test" to check it.`);
