import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from '../support/create-test-app.js';

describe('Application (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports a healthy application', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('GET /api-docs-json exposes the OpenAPI document', async () => {
    const response = await app.inject({ method: 'GET', url: '/api-docs-json' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveProperty('openapi');
  });

  it('returns a normalised error body for an unknown route', async () => {
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      path: '/does-not-exist',
      details: null,
    });
  });
});
