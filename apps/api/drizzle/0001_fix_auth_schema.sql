ALTER TABLE "auth_challenges" RENAME COLUMN "expiresAt" TO "expires_at";--> statement-breakpoint
ALTER TABLE "outbox_events" RENAME COLUMN "occured_at" TO "occurred_at";--> statement-breakpoint
DROP INDEX "auth_challenges_expires_at_idx";--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "published_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "outbox_events" ALTER COLUMN "published_at" DROP NOT NULL;--> statement-breakpoint
CREATE INDEX "auth_challenges_expires_at_idx" ON "auth_challenges" USING btree ("expires_at");