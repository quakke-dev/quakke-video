import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({ path: '../../.env.local' });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not defined in the root .env.local');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema/*.schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: databaseUrl,
  },
});
