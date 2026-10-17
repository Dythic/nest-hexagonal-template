import { ArgumentsHost } from '@nestjs/common';

export type CapturedReply = {
  statusCode: number | undefined;
  body: unknown;
};

type FakeReply = {
  status: (statusCode: number) => FakeReply;
  send: (body: unknown) => FakeReply;
};

export type FakeHttpHost = Readonly<{
  host: ArgumentsHost;
  reply: CapturedReply;
}>;

export const createFakeHttpHost = (url: string = '/test'): FakeHttpHost => {
  const reply: CapturedReply = { statusCode: undefined, body: undefined };

  const response: FakeReply = {
    status: (statusCode: number): FakeReply => {
      reply.statusCode = statusCode;
      return response;
    },
    send: (body: unknown): FakeReply => {
      reply.body = body;
      return response;
    },
  };

  const host = {
    switchToHttp: (): Readonly<{ getResponse: () => FakeReply; getRequest: () => Readonly<{ url: string }> }> => ({
      getResponse: (): FakeReply => response,
      getRequest: (): Readonly<{ url: string }> => ({ url }),
    }),
  } as unknown as ArgumentsHost;

  return { host, reply };
};
