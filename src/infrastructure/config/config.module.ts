import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseAppConfig } from './config.mapper.js';
import type { AppConfig } from './config.schema.js';
import { APP_CONFIG } from './config.token.js';

const APP_CONFIG_KEY = 'app';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: '.env',
      validate: (environment: Record<string, unknown>): Record<string, AppConfig> => ({
        [APP_CONFIG_KEY]: parseAppConfig(environment),
      }),
    }),
  ],
  providers: [
    {
      provide: APP_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): AppConfig => configService.getOrThrow<AppConfig>(APP_CONFIG_KEY),
    },
  ],
  exports: [APP_CONFIG],
})
export class AppConfigModule {}
