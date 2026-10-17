import { mapEnvironmentToConfig, parseAppConfig } from '@infrastructure/config/config.mapper.js';
import { describe, expect, it } from 'vitest';

describe('mapEnvironmentToConfig', () => {
  it('maps environment variables and drops blank values', () => {
    const config = mapEnvironmentToConfig({
      PORT: '8080',
      GCP_PROJECT_ID: 'my-project',
      FIRESTORE_DATABASE_ID: '   ',
      PUBSUB_EMULATOR_HOST: 'localhost:8085',
    });

    expect(config).toMatchObject({
      port: '8080',
      gcpProjectId: 'my-project',
      firestore: { databaseId: undefined },
      pubsub: { emulatorHost: 'localhost:8085' },
    });
  });
});

describe('parseAppConfig', () => {
  it('applies defaults when the environment is empty', () => {
    expect(parseAppConfig({})).toEqual({
      env: 'local',
      port: 3000,
      logLevel: 'info',
      logMode: 'prod',
      firestore: {},
      pubsub: {},
    });
  });

  it('coerces the port to a number', () => {
    expect(parseAppConfig({ PORT: '4000' }).port).toBe(4000);
  });

  it('rejects an unknown log level', () => {
    expect(() => parseAppConfig({ LOG_LEVEL: 'verbose' })).toThrow(/Invalid configuration/);
  });

  it('rejects a non numeric port', () => {
    expect(() => parseAppConfig({ PORT: 'abc' })).toThrow(/Invalid configuration/);
  });
});
