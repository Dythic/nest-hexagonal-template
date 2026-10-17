import { AppConfigModule } from '@infrastructure/config/config.module.js';
import type { AppConfig } from '@infrastructure/config/config.schema.js';
import { APP_CONFIG } from '@infrastructure/config/config.token.js';
import { Module } from '@nestjs/common';
import { LoggerModule, Params } from 'nestjs-pino';

const createLoggerParams = (config: AppConfig): Params => ({
  pinoHttp: {
    level: config.logLevel,
    transport:
      config.logMode === 'debug'
        ? { target: 'pino-pretty', options: { singleLine: true, colorize: true, translateTime: 'SYS:standard' } }
        : undefined,
  },
});

@Module({
  imports: [
    LoggerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [APP_CONFIG],
      useFactory: createLoggerParams,
    }),
  ],
})
export class LoggingModule {}
