import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from '../../src/app.module.js';
import { configureApplication } from '../../src/app.setup.js';

export type TestingModuleCustomiser = (builder: TestingModuleBuilder) => TestingModuleBuilder;

/**
 * Boots the whole application on Fastify, ready to be exercised with `app.inject()`.
 */
export const createTestApp = async (
  customise: TestingModuleCustomiser = (builder: TestingModuleBuilder): TestingModuleBuilder => builder,
): Promise<NestFastifyApplication> => {
  const moduleRef = await customise(Test.createTestingModule({ imports: [AppModule] })).compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

  configureApplication(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
};
