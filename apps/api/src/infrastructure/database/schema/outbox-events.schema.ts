import {
  uuid,
  pgTable,
  varchar,
  integer,
  jsonb,
  timestamp,
  text,
  index,
} from 'drizzle-orm/pg-core';

export const outboxEvents = pgTable(
  'outbox_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    eventType: varchar('event_type', {
      length: 160,
    }).notNull(),

    eventVersion: integer('event_version').notNull().default(1),

    aggregateType: varchar('aggregate_type', {
      length: 64,
    }).notNull(),

    aggregateId: uuid('aggregate_id').notNull(),

    payload: jsonb('payload').$type<Record<string, unknown>>().notNull(),

    occuredAt: timestamp('occured_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),

    publishedAt: timestamp('published_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),

    attempts: integer('attempts').notNull().default(0),

    lastError: text('last_error'),

    nextAttemptAt: timestamp('next_attempt_at', {
      withTimezone: true,
      mode: 'date',
    }),
  },
  (table) => [
    index('outbox_events_unpublished_idx').on(table.publishedAt, table.nextAttemptAt),

    index('outbox_events_aggregate_idx').on(table.aggregateType, table.aggregateId),
  ],
);

export type OutboxEvent = typeof outboxEvents.$inferSelect;
export type NewOutboxEvent = typeof outboxEvents.$inferInsert;
