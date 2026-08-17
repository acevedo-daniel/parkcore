import 'dotenv/config';
import type { Server } from 'node:http';
import app from './app.js';
import { env } from './src/config/env.js';
import { prisma } from './src/config/prisma.js';
import { logger } from './src/lib/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'ParkCore API running');
  logger.info({ env: env.NODE_ENV }, 'Runtime environment');
});

let isShuttingDown = false;

function closeServer(httpServer: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    httpServer.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  logger.info({ signal }, 'Received shutdown signal');

  const forceCloseTimer = setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);

  forceCloseTimer.unref();

  try {
    await closeServer(server);

    await prisma.$disconnect();
    clearTimeout(forceCloseTimer);

    logger.info('Shutdown completed');
    process.exit(0);
  } catch (error) {
    clearTimeout(forceCloseTimer);
    logger.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
  void shutdown('unhandledRejection');
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException');
});
