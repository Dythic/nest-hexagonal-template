import type { AppConfig } from '@infrastructure/config/config.schema.js';
import { APP_CONFIG } from '@infrastructure/config/config.token.js';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { App, getApps, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirestoreClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirestoreClient.name);
  private database: Firestore | undefined;

  constructor(@Inject(APP_CONFIG) private readonly config: AppConfig) {}

  /**
   * The initialised Firestore instance.
   * @throws Error when accessed before the module has been initialised.
   */
  get db(): Firestore {
    if (!this.database) {
      throw new Error('Firestore client is not initialised.');
    }
    return this.database;
  }

  onModuleInit(): void {
    const { databaseId, emulatorHost } = this.config.firestore;

    if (emulatorHost) {
      process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
      this.logger.log(`Connecting to the Firestore emulator at ${emulatorHost}`);
    } else {
      this.logger.log(`Connecting to the Firestore database ${databaseId ?? '(default)'}`);
    }

    const app = this.resolveApp();
    const database = databaseId ? getFirestore(app, databaseId) : getFirestore(app);
    database.settings({ ignoreUndefinedProperties: true });
    this.database = database;
  }

  async onModuleDestroy(): Promise<void> {
    await this.database?.terminate();
  }

  private resolveApp(): App {
    return getApps()[0] ?? initializeApp({ projectId: this.config.gcpProjectId });
  }
}
