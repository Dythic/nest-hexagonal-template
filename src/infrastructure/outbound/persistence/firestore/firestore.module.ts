import { AppConfigModule } from '@infrastructure/config/config.module.js';
import { Module } from '@nestjs/common';
import { FirestoreClient } from './firestore.client.js';

@Module({
  imports: [AppConfigModule],
  providers: [FirestoreClient],
  exports: [FirestoreClient],
})
export class FirestoreModule {}
