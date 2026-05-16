import { resolve } from 'node:path';

export const migrationConfig = {
  migrationsDirectory: resolve(process.cwd(), 'src/db/migrations'),
  trackingTable: 'schema_migrations',
} as const;
