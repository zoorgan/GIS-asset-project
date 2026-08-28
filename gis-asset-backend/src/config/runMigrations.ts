import fs from 'fs';
import path from 'path';
import { pool } from './database';


async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename    TEXT PRIMARY KEY,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(): Promise<Set<string>> {
  const result = await pool.query<{ filename: string }>(
    'SELECT filename FROM schema_migrations'
  );
  return new Set(result.rows.map((row) => row.filename));
}

async function runMigrations(): Promise<void> {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();

  for (const file of files) {
    if (applied.has(file)) {
      
      console.log(`[migrate] skipping already-applied ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    
    console.log(`[migrate] applying ${file}...`);
    await pool.query(sql);
    await pool.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);

    console.log(`[migrate] applied ${file}`);
  }

  
  console.log('[migrate] all migrations applied');
  await pool.end();
}

runMigrations().catch((error) => {
  
  console.error('[migrate] failed:', error);
  process.exit(1);
});
