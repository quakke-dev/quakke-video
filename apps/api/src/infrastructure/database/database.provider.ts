import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';
import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
import { parseApiEnv } from '@quakke/config';

export type Database = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseProvider implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseProvider.name);
  private readonly pool: Pool;

  readonly db: Database;

  constructor() {
    const env = parseApiEnv(process.env);

    this.pool = new Pool({
      connectionString: env.DATABASE_URL,
      max: 10,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 30_000,
    });

    this.db = drizzle({
      client: this.pool,
      schema,
    });
  }

  async onModuleInit() {
    await this.pool.query('select 1');

    this.logger.log('PostgreSQL connection established');
  }

  async onApplicationShutdown() {
    await this.pool.end();

    this.logger.log('PostgreSQL connection closed');
  }
}
