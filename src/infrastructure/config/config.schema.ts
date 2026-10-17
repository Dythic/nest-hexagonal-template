import { z } from 'zod';

export const LogLevelSchema = z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);

export const LogModeSchema = z.enum(['prod', 'debug']);

export const AppConfigSchema = z.object({
  env: z.string().min(1).default('local'),
  port: z.coerce.number().int().positive().default(3000),
  logLevel: LogLevelSchema.default('info'),
  logMode: LogModeSchema.default('prod'),
  gcpProjectId: z.string().min(1).optional(),
  firestore: z.object({
    databaseId: z.string().min(1).optional(),
    emulatorHost: z.string().min(1).optional(),
  }),
  pubsub: z.object({
    emulatorHost: z.string().min(1).optional(),
  }),
});

export type AppConfig = Readonly<z.infer<typeof AppConfigSchema>>;
