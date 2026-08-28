import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { env } from './env';

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,
  max: env.db.poolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  
  console.error('[postgres] Unexpected error on idle client', err);
});


export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: ReadonlyArray<unknown> = []
): Promise<QueryResult<T>> {
  const start = Date.now();
  const result = await pool.query<T>(text, params as unknown[]);
  if (!env.isProduction) {
    const durationMs = Date.now() - start;
    
    console.debug(`[sql] ${durationMs}ms | ${text.replace(/\s+/g, ' ').trim()}`);
  }
  return result;
}


export async function withTransaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkDatabaseConnection(): Promise<void> {
  await pool.query('SELECT 1');
}
