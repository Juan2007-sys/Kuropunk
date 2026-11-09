import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// Almacén en memoria para Rate Limiting por IP (Zero-Trust Anti-DoS / Anti-Bots)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 35; // Límite estricto por minuto por IP
const MAX_PAYLOAD_BYTES = 50 * 1024; // 50KB máximo por petición

async function bootstrap() {
  const logger = new Logger('KuroPunkBackend');
  const app = await NestFactory.create(AppModule);

  const expressApp = app.getHttpAdapter().getInstance();
  if (expressApp && typeof expressApp.disable === 'function') {
    expressApp.disable('x-powered-by');
  }

  // 1. CORS Estricto (Registrado antes del Rate Limiter para que las respuestas 413/429 incluyan cabeceras CORS)
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://kuropunk.vercel.app',
        'https://frontend-cyan-nu-86.vercel.app',
      ];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:'))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por política CORS Zero-Trust de KuroPunk'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,x-admin-key,Accept',
    credentials: true,
  });

  // 2. Límite estricto de tamaño de Payload (50KB máx.) y Cabeceras de Seguridad HTTP Zero-Trust
  app.use((req: Request, res: Response, next: NextFunction) => {
    const contentLength = Number(req.headers['content-length'] || 0);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      res.status(413).json({
        success: false,
        statusCode: 413,
        timestamp: new Date().toISOString(),
        path: req.url,
        error: {
          message: 'El tamaño del payload excede el límite de seguridad permitido (50KB).',
        },
      });
      return;
    }

    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
    );
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    next();
  });

  // 3. Rate Limiting Global por IP (Anti-Fuerza Bruta, Anti-Scraping y Anti-DoS)
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'OPTIONS') return next();
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(clientIp);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(clientIp, { count: 1, resetAt: now + RATE_WINDOW_MS });
      res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
      res.setHeader('X-RateLimit-Remaining', String(MAX_REQUESTS_PER_WINDOW - 1));
      return next();
    }

    record.count += 1;
    const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - record.count);
    res.setHeader('X-RateLimit-Limit', String(MAX_REQUESTS_PER_WINDOW));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (record.count > MAX_REQUESTS_PER_WINDOW) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfterSec));
      res.status(429).json({
        success: false,
        statusCode: 429,
        timestamp: new Date().toISOString(),
        path: req.url,
        error: {
          message: `Demasiadas peticiones desde tu IP. Intenta nuevamente en ${retryAfterSec} segundos.`,
        },
      });
      return;
    }

    if (rateLimitStore.size > 2000) {
      for (const [ip, data] of rateLimitStore.entries()) {
        if (now > data.resetAt) rateLimitStore.delete(ip);
      }
    }

    next();
  });

  // Global API Route Prefix
  app.setGlobalPrefix('api');

  // 5. Global Validation Pipe (Allow-listing estricto: rechaza Mass Assignment / Over-posting)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Filters & Interceptors
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`⚡ KUROPUNK // VANDAL STITCH API running on: http://localhost:${port}/api`);
  const dbType = process.env.DB_TYPE || (process.env.DATABASE_URL ? 'postgres' : 'sqlite');
  logger.log(
    `⚡ Database target: ${
      dbType === 'postgres'
        ? `PostgreSQL (${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_DATABASE || 'tienda_crochet'})`
        : (process.env.DATABASE_PATH || './tienda.sqlite')
    }`,
  );
}

bootstrap();
