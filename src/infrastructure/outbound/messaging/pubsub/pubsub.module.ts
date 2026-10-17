import { MessagePublisher } from '@domain/ports/message-publisher.port.js';
import { AppConfigModule } from '@infrastructure/config/config.module.js';
import { Module } from '@nestjs/common';
import { GcpPubSubAdapter } from './gcp-pubsub.adapter.js';

@Module({
  imports: [AppConfigModule],
  providers: [{ provide: MessagePublisher, useClass: GcpPubSubAdapter }],
  exports: [MessagePublisher],
})
export class PubSubModule {}
