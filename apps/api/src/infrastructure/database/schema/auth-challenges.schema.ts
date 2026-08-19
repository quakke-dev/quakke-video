import {
  timestamp,
  uuid,
  pgEnum,
  pgTable,
  integer,
  jsonb,
  uniqueIndex,
  index,
  varchar,
} from 'drizzle-orm/pg-core';
import { users } from './users.schema';

export const authChallengePurposeEnum = pgEnum('auth_challenge_purpose', [
  'verify_email',
  'reset_password',
  'change_email',
]);

export const authChallenges = pgTable(
  'auth_challenges',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    purpose: authChallengePurposeEnum('purpose').notNull(),

    tokenHash: varchar('token_hash', {
      length: 64,
    }).notNull(),

    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),

    consumedAt: timestamp('consumed_at', {
      withTimezone: true,
      mode: 'date',
    }),

    attempts: integer('attempts').notNull().default(0),

    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('auth_challenges_token_hash_uidx').on(table.tokenHash),

    index('auth_challenges_user_purpose_idx').on(table.userId, table.purpose),

    index('auth_challenges_expires_at_idx').on(table.expiresAt),
  ],
);

export type AuthChallenge = typeof authChallenges.$inferSelect;
export type NewAuthChallenge = typeof authChallenges.$inferInsert;
