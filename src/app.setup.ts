import { BusinessRuleViolationExceptionFilter } from '@infrastructure/inbound/exception-filters/business-rule-violation.exception-filter.js';
import { GlobalExceptionFilter } from '@infrastructure/inbound/exception-filters/global.exception-filter.js';
import { ItemNotFoundExceptionFilter } from '@infrastructure/inbound/exception-filters/item-not-found.exception-filter.js';
import { ZodValidationExceptionFilter } from '@infrastructure/inbound/exception-filters/zod-validation.exception-filter.js';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { APP_METADATA } from './app.metadata.js';

export const API_DOCS_PATH = 'api-docs';

const createOpenApiDocument = (app: NestFastifyApplication): OpenAPIObject => {
  const config = new DocumentBuilder()
    .setTitle(APP_METADATA.title)
    .setDescription(APP_METADATA.description)
    .setVersion(process.env.npm_package_version ?? '0.0.0')
    .build();

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
};

/**
 * Applies the cross-cutting HTTP configuration shared by the runtime and the end-to-end tests.
 * The catch-all filter is registered first so that the specific filters take precedence.
 */
export const configureApplication = (app: NestFastifyApplication): NestFastifyApplication => {
  app.useGlobalFilters(
    new GlobalExceptionFilter(),
    new ItemNotFoundExceptionFilter(),
    new BusinessRuleViolationExceptionFilter(),
    new ZodValidationExceptionFilter(),
  );

  SwaggerModule.setup(API_DOCS_PATH, app, (): OpenAPIObject => createOpenApiDocument(app));

  return app;
};
