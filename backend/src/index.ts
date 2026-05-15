import cors from 'cors';
import express from 'express';
import type { ErrorRequestHandler } from 'express';
import { corsOrigins, env } from './config/env.js';
import { closePrismaClients, prisma } from './db/prisma.js';
import { apiRoutes } from './routes/apiRoutes.js';

const app = express();

const corsOptions = corsOrigins.includes('*')
  ? undefined
  : {
      origin: corsOrigins
    };

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', apiRoutes);

app.use((_req, res) => {
  res.status(404).json({
    error: 'NOT_FOUND',
    message: 'Endpoint not found.'
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Unhandled backend error:', error);

  res.status(500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'Unexpected server error.'
  });
};

app.use(errorHandler);

const startServer = async () => {
  await prisma.$queryRaw`SELECT 1`;

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`Backend listening on port ${env.port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start backend:', error);
  process.exit(1);
});

const shutdown = async () => {
  await closePrismaClients();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
