import { ArgumentsHost } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AppErrorResponse } from '../api/dto/app-error-response.dto.js';

export type ErrorReplyPayload = Readonly<Omit<AppErrorResponse, 'timestamp' | 'path'>>;

/**
 * Sends a normalised {@link AppErrorResponse} through the Fastify reply of the current HTTP context.
 */
export const replyWithError = (host: ArgumentsHost, payload: ErrorReplyPayload): void => {
  const context = host.switchToHttp();
  const request = context.getRequest<FastifyRequest>();
  const body: AppErrorResponse = {
    ...payload,
    timestamp: new Date().toISOString(),
    path: request.url,
  };

  void context.getResponse<FastifyReply>().status(payload.statusCode).send(body);
};
