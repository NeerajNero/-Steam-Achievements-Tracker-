import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

export type DrizzleDatabase = NodePgDatabase<typeof schema>;

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;
  private readonly database: DrizzleDatabase;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is required to initialize the database connection.');
    }

    this.pool = new Pool({ connectionString: databaseUrl });
    this.database = drizzle(this.pool, { schema });
  }

  get db(): DrizzleDatabase {
    return this.database;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
