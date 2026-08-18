import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { pgEnum, pgTable } from 'drizzle-orm/pg-core';

export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'blocked', 'deleted']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),

  status: userStatusEnum('status').notNull().default('pending'),

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

  deletedAt: timestamp('deleted_at', {
    withTimezone: true,
    mode: 'date',
  }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
