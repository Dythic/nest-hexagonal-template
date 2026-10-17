import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { AppErrorResponseDto } from '../dto/app-error-response.dto.js';

export type ApiStandardResponsesOptions = Readonly<{
  type?: Type<unknown> | [Type<unknown>];
  status?: HttpStatus;
}>;

const errorResponse = (status: HttpStatus, description: string): MethodDecorator & ClassDecorator =>
  ApiResponse({ status, description, schema: { $ref: getSchemaPath(AppErrorResponseDto) } });

/**
 * Documents the success response of an endpoint together with the shared error responses.
 */
export const ApiStandardResponses = (options: ApiStandardResponsesOptions = {}): ReturnType<typeof applyDecorators> =>
  applyDecorators(
    ApiExtraModels(AppErrorResponseDto),
    errorResponse(HttpStatus.BAD_REQUEST, 'Validation or business rule error'),
    errorResponse(HttpStatus.NOT_FOUND, 'Resource not found'),
    errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, 'Internal server error'),
    ...(options.type ? [ApiResponse({ status: options.status ?? HttpStatus.OK, type: options.type })] : []),
  );
