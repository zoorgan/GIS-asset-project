import dotenv from 'dotenv';

dotenv.config();


function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: parseInt(required('PORT', '4000'), 10),
  nodeEnv: required('NODE_ENV', 'development'),

  db: {
    host: required('PGHOST', 'localhost'),
    port: parseInt(required('PGPORT', '5432'), 10),
    database: required('PGDATABASE', 'gis_assets'),
    user: required('PGUSER', 'postgres'),
    password: required('PGPASSWORD', 'postgres'),
    poolMax: parseInt(required('PG_POOL_MAX', '20'), 10),
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev_secret_change_me'),
    expiresIn: required('JWT_EXPIRES_IN', '8h'),
  },

  corsOrigin: required('CORS_ORIGIN', '*'),

  isProduction: (process.env.NODE_ENV ?? 'development') === 'production',
};
