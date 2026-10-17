import { MessagePublisher, TopicEventMap, TopicName } from '@domain/ports/message-publisher.port.js';
import { PubSub, Topic } from '@google-cloud/pubsub';
import type { AppConfig } from '@infrastructure/config/config.schema.js';
import { APP_CONFIG } from '@infrastructure/config/config.token.js';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';

const EMULATOR_PROJECT_ID = 'demo-project';

@Injectable()
export class GcpPubSubAdapter implements MessagePublisher, OnModuleDestroy {
  private readonly logger = new Logger(GcpPubSubAdapter.name);
  private readonly client: PubSub;
  private readonly isEmulator: boolean;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    const { emulatorHost } = config.pubsub;
    this.isEmulator = emulatorHost !== undefined;

    if (emulatorHost) {
      this.logger.log(`Connecting to the Pub/Sub emulator at ${emulatorHost}`);
      this.client = new PubSub({ projectId: config.gcpProjectId ?? EMULATOR_PROJECT_ID, apiEndpoint: emulatorHost });
    } else {
      this.client = new PubSub({ projectId: config.gcpProjectId });
    }
  }

  async publish<K extends TopicName>(topicName: K, event: Readonly<TopicEventMap[K]>): Promise<void> {
    const name: string = topicName;
    const topic = this.client.topic(name);

    if (this.isEmulator) {
      await this.ensureTopicExists(topic);
    }

    const messageId = await topic.publishMessage({ data: Buffer.from(JSON.stringify(event)) });
    this.logger.debug(`Published message ${messageId} to topic ${name}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  private async ensureTopicExists(topic: Topic): Promise<void> {
    const [exists] = await topic.exists();

    if (!exists) {
      await topic.create();
      this.logger.log(`Created missing topic ${topic.name} on the emulator`);
    }
  }
}
