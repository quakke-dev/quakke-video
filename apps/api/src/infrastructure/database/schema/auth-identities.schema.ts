import { uniqueIndex, uuid, varchar, pgEnum, pgTable, index } from 'drizzle-orm/pg-core';
import { users } from './users.schema';
import { timestamp } from 'drizzle-orm/pg-core';

export const authProviderEnum = pgEnum('auth_provider', ['local', 'google', 'github', 'yandex']);

export const authIdentities = pgTable(
  'auth_identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
      }),

    provider: authProviderEnum('provider').notNull().default('local'),

    providerSubject: varchar('provider_subject', {
      length: 255,
    }),

    email: varchar('email', {
      length: 320,
    }).notNull(),

    emailNormalized: varchar('email_normalized', {
      length: 320,
    }).notNull(),

    passwordHash: varchar('password_hash', {
      length: 255,
    }),

    emailVerifiedAt: timestamp('email_verified_at', {
      withTimezone: true,
      mode: 'date',
    }),

    createdAt: timestamp('created_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('auth_identities_email_normalized_uidx').on(table.emailNormalized),

    uniqueIndex('auth_identities_subject_normalized_uidx').on(
      table.provider,
      table.providerSubject,
    ),

    index('auth_identities_user_id_idx').on(table.userId),
  ],
);

export type AuthIdentity = typeof authIdentities.$inferSelect;
export type NewAuthIdentity = typeof authIdentities.$inferInsert;
