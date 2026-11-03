import express from 'express';
import type { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { env } from './config/env.js';
import { checkDbHealth } from './config/db.js';
import { authRoutes } from './routes/auth.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export function createApp(): Application {
  const app = express();

  // 1. Trust proxy for reverse proxies / load balancers
  app.set('trust proxy', 1);

  // 2. Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Useful for dev/APIs
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // 3. CORS Configuration: Allow any IP / Origin to access backend for now
  app.use(
    cors({
      origin: (_origin, callback) => {
        // Allows any incoming IP or domain (e.g. localhost, local network IPs, cloud hosts)
        callback(null, true);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    })
  );

  // 4. Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // 5. Compression
  app.use(compression());

  // 6. Body Parsers & Cookie Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 7. HTTP Parameter Pollution Protection
  app.use(hpp());

  // 8. General Rate Limiter for all traffic
  app.use('/api', generalLimiter);

  // 9. Root & Health Check Endpoints
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'HackVsak Backend API',
      status: 'operational',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      routes: {
        health: '/health',
        auth: '/api/v1/auth',
      },
    });
  });

  app.get('/health', (_req: Request, res: Response) => {
    const dbStatus = checkDbHealth();
    const isHealthy = dbStatus.status === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: env.NODE_ENV,
    });
  });

  // 10. Mount Auth Routes at /api/v1/auth
  app.use('/api/v1/auth', authRoutes);

  // 11. 404 Route Not Found Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: `Cannot ${req.method} ${req.originalUrl}. Route does not exist on this server.`,
      },
    });
  });

  // 12. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
