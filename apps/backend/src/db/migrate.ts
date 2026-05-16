import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { performance } from 'node:perf_hooks';

import { Client } from 'pg';

import { migrationConfig } from './migration-config';

type MigrationCommand = 'run' | 'status' | 'pending' | 'create';

interface MigrationFile {
  filename: string;
  path: string;
}

interface AppliedMigration {
  filename: string;
  appliedAt: Date;
}

interface MigrationStatus {
  filename: string;
  state: 'applied' | 'pending';
  appliedAt: Date | null;
}

const trackingTableSql = `
CREATE TABLE IF NOT EXISTS ${migrationConfig.trackingTable} (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

async function main(): Promise<void> {
  const command = parseCommand(process.argv[2]);

  if (command === 'create') {
    await createMigration(process.argv.slice(3));
    return;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required for migration commands.');
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    if (command === 'run') {
      await runMigrations(client);
      return;
    }

    if (command === 'pending') {
      await printPendingMigrations(client);
      return;
    }

    await printMigrationStatus(client);
  } finally {
    await client.end();
  }
}

function parseCommand(value: string | undefined): MigrationCommand {
  if (
    value === 'run' ||
    value === 'status' ||
    value === 'pending' ||
    value === 'create'
  ) {
    return value;
  }

  return 'status';
}

async function listMigrationFiles(): Promise<MigrationFile[]> {
  const entries = await readdir(migrationConfig.migrationsDirectory, {
    withFileTypes: true,
  });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((filename) => filename.endsWith('.sql'))
    .sort((left, right) => left.localeCompare(right))
    .map((filename) => ({
      filename,
      path: join(migrationConfig.migrationsDirectory, filename),
    }));
}

async function hasTrackingTable(client: Client): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    "SELECT to_regclass($1) IS NOT NULL AS exists",
    [migrationConfig.trackingTable],
  );

  return result.rows[0]?.exists ?? false;
}

async function ensureTrackingTable(client: Client): Promise<void> {
  await client.query(trackingTableSql);
}

async function getAppliedMigrations(client: Client): Promise<AppliedMigration[]> {
  if (!(await hasTrackingTable(client))) {
    return [];
  }

  const result = await client.query<{
    filename: string;
    applied_at: Date;
  }>(
    `SELECT filename, applied_at
     FROM ${migrationConfig.trackingTable}
     ORDER BY filename ASC`,
  );

  return result.rows.map((row) => ({
    filename: row.filename,
    appliedAt: row.applied_at,
  }));
}

async function getMigrationStatuses(client: Client): Promise<MigrationStatus[]> {
  const [files, appliedMigrations] = await Promise.all([
    listMigrationFiles(),
    getAppliedMigrations(client),
  ]);
  const appliedByFilename = new Map(
    appliedMigrations.map((migration) => [migration.filename, migration]),
  );

  return files.map((file) => {
    const applied = appliedByFilename.get(file.filename);

    return {
      filename: file.filename,
      state: applied ? 'applied' : 'pending',
      appliedAt: applied?.appliedAt ?? null,
    };
  });
}

async function runMigrations(client: Client): Promise<void> {
  await ensureTrackingTable(client);

  const files = await listMigrationFiles();
  const applied = new Set(
    (await getAppliedMigrations(client)).map((migration) => migration.filename),
  );
  const pending = files.filter((file) => !applied.has(file.filename));

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const migration of pending) {
    await runSingleMigration(client, migration);
  }
}

async function runSingleMigration(
  client: Client,
  migration: MigrationFile,
): Promise<void> {
  const sql = await readFile(migration.path, 'utf8');
  const startedAt = performance.now();

  console.log(`Applying ${migration.filename}...`);
  await client.query('BEGIN');

  try {
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('steam-achievement-tracker-schema-migrations'))",
    );

    const alreadyApplied = await isMigrationApplied(client, migration.filename);

    if (alreadyApplied) {
      await client.query('COMMIT');
      console.log(`Skipped ${migration.filename}; already applied.`);
      return;
    }

    await client.query(sql);
    await client.query(
      `INSERT INTO ${migrationConfig.trackingTable} (filename)
       VALUES ($1)`,
      [migration.filename],
    );
    await client.query('COMMIT');

    const durationMs = Math.round(performance.now() - startedAt);
    console.log(`Applied ${migration.filename} in ${durationMs}ms.`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Failed ${migration.filename}.`);
    throw error;
  }
}

async function isMigrationApplied(
  client: Client,
  filename: string,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM ${migrationConfig.trackingTable}
       WHERE filename = $1
     ) AS exists`,
    [filename],
  );

  return result.rows[0]?.exists ?? false;
}

async function printMigrationStatus(client: Client): Promise<void> {
  const statuses = await getMigrationStatuses(client);

  if (statuses.length === 0) {
    console.log('No migration files found.');
    return;
  }

  for (const status of statuses) {
    const appliedAt = status.appliedAt?.toISOString() ?? '-';
    console.log(`${status.state.padEnd(7)} ${status.filename} ${appliedAt}`);
  }
}

async function printPendingMigrations(client: Client): Promise<void> {
  const pending = (await getMigrationStatuses(client)).filter(
    (status) => status.state === 'pending',
  );

  if (pending.length === 0) {
    console.log('No pending migrations.');
    return;
  }

  for (const status of pending) {
    console.log(status.filename);
  }
}

async function createMigration(args: string[]): Promise<void> {
  const name = args.join('-').trim();

  if (!name) {
    throw new Error('Provide a migration name, for example: migration:create add-user-goals');
  }

  const files = await listMigrationFiles();
  const nextNumber = files.length + 1;
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  if (!slug) {
    throw new Error('Migration name must contain at least one letter or number.');
  }

  const filename = `${String(nextNumber).padStart(4, '0')}-${slug}.sql`;
  const filePath = join(migrationConfig.migrationsDirectory, filename);
  const template = `-- ${filename}\n-- Review this SQL before running it. Do not use ORM schema sync.\n\n`;

  await writeFile(filePath, template, { flag: 'wx' });
  console.log(`Created ${basename(filePath)}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
