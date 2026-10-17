import type { AppConfig } from '@infrastructure/config/config.schema.js';
import { APP_CONFIG } from '@infrastructure/config/config.token.js';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module.js';
import { configureApplication } from './app.setup.js';

const bootstrap = async (): Promise<void> => {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter(), { bufferLogs: true });
  const logger = app.get(Logger);
  const config = app.get<AppConfig>(APP_CONFIG);

  app.useLogger(logger);
  app.enableShutdownHooks();
  configureApplication(app);

  await app.listen(config.port, '0.0.0.0');
  logger.log(`Application listening on ${await app.getUrl()}`);
};

void bootstrap();
