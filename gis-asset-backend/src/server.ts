import { createApp } from './app';
import { env } from './config/env';
import { checkDatabaseConnection, pool } from './config/database';

async function bootstrap(): Promise<void> {
  try {
    await checkDatabaseConnection();
  
    console.log('[db] Connection verified');
  } catch (error) {
    
    console.error('[db] Failed to connect to PostgreSQL. Check your .env settings.', error);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.port, () => {
    
    console.log(`[server] Listening on port ${env.port} (${env.nodeEnv})`);
    
    console.log(`[server] Swagger docs: http://localhost:${env.port}/api-docs`);
  });

  const shutdown = async (signal: string): Promise<void> => {
    
    console.log(`[server] Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      
      console.log('[server] Shutdown complete');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap();
