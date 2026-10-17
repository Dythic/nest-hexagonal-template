import { prettifyError } from 'zod';
import { AppConfig, AppConfigSchema } from './config.schema.js';

type RawEnvironment = Readonly<Record<string, unknown>>;

const readVariable = (environment: RawEnvironment, key: string): string | undefined => {
  const value = environment[key];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : undefined;
};

/**
 * Maps raw environment variables to the shape expected by {@link AppConfigSchema}.
 */
export const mapEnvironmentToConfig = (environment: RawEnvironment): Readonly<Record<string, unknown>> => ({
  env: readVariable(environment, 'ENV'),
  port: readVariable(environment, 'PORT'),
  logLevel: readVariable(environment, 'LOG_LEVEL'),
  logMode: readVariable(environment, 'LOG_MODE'),
  gcpProjectId: readVariable(environment, 'GCP_PROJECT_ID'),
  firestore: {
    databaseId: readVariable(environment, 'FIRESTORE_DATABASE_ID'),
    emulatorHost: readVariable(environment, 'FIRESTORE_EMULATOR_HOST'),
  },
  pubsub: {
    emulatorHost: readVariable(environment, 'PUBSUB_EMULATOR_HOST'),
  },
});

/**
 * Validates raw environment variables and returns a typed configuration.
 * @throws Error when the environment does not satisfy {@link AppConfigSchema}.
 */
export const parseAppConfig = (environment: RawEnvironment): AppConfig => {
  const result = AppConfigSchema.safeParse(mapEnvironmentToConfig(environment));

  if (!result.success) {
    throw new Error(`Invalid configuration:\n${prettifyError(result.error)}`);
  }

  return result.data;
};
