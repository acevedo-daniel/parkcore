import cors, { type CorsOptions } from 'cors';
import express from 'express';
import helmet from 'helmet';

import { mountApiDocs } from './src/config/api-docs.js';
import { createCorsOriginValidator } from './src/config/cors.js';
import { env } from './src/config/env.js';
import { generateOpenApiDocument } from './src/config/openapi.js';
import { NotFoundError } from './src/errors/index.js';
import { errorHandler } from './src/middlewares/error-handler.middleware.js';
import { requestLogger } from './src/middlewares/logger.middleware.js';

import { authRouter } from './src/features/auth/auth.routes.js';
import { parkingSessionRouter } from './src/features/parking-session/parking-session.routes.js';
import { parkingRouter } from './src/features/parking/parking.routes.js';
import { userRouter } from './src/features/user/user.routes.js';

const app = express();

app.set('trust proxy', 1);
app.use(requestLogger);
app.use(helmet());

const corsOptions: CorsOptions = {
  origin: createCorsOriginValidator(env.NODE_ENV, env.CORS_ORIGINS),
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

if (env.NODE_ENV !== 'production' || env.ENABLE_API_DOCS) {
  const openApiSpec = generateOpenApiDocument();
  mountApiDocs(app, openApiSpec);
}

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'parkcore-api',
  });
});

app.use('/users', userRouter);
app.use('/parkings', parkingRouter);
app.use('/sessions', parkingSessionRouter);
app.use('/auth', authRouter);

app.use((_req, _res, next) => {
  next(new NotFoundError('Route not found'));
});

app.use(errorHandler);

export default app;
