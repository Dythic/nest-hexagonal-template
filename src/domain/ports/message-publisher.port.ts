/**
 * Maps every topic name to the payload published on it.
 * Add one entry per topic, e.g. `'invoice-created': Readonly<{ invoiceId: string }>`.
 */
export type TopicEventMap = Readonly<Record<never, never>>;

export type TopicName = keyof TopicEventMap;

export abstract class MessagePublisher {
  abstract publish<K extends TopicName>(topic: K, event: Readonly<TopicEventMap[K]>): Promise<void>;
}
