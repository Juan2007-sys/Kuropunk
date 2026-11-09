import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

// Registro en memoria de intentos fallidos de acceso administrativo por IP (Anti-Fuerza Bruta)
const failedAdminAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MS = 5 * 60 * 1000;

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const clientIp =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown';

    const now = Date.now();
    const record = failedAdminAttempts.get(clientIp);
    if (record && now < record.lockUntil) {
      throw new HttpException(
        'IP bloqueada temporalmente por múltiples intentos fallidos de acceso administrativo.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const configuredKey =
      process.env.ADMIN_SECRET_KEY || 'kuropunk_admin_secret_2026';

    // 1. Validar Header x-admin-key
    const adminKey = request.headers['x-admin-key'];
    if (
      typeof adminKey === 'string' &&
      this.safeCompare(adminKey.trim(), configuredKey)
    ) {
      failedAdminAttempts.delete(clientIp);
      return true;
    }

    // 2. Validar Authorization Bearer token exacto (SIN token.includes('admin'))
    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (this.safeCompare(token, configuredKey)) {
        failedAdminAttempts.delete(clientIp);
        return true;
      }
    }

    const current = failedAdminAttempts.get(clientIp) || { count: 0, lockUntil: 0 };
    if (now > current.lockUntil && current.count >= MAX_FAILED_ATTEMPTS) {
      current.count = 0;
    }
    current.count += 1;
    if (current.count >= MAX_FAILED_ATTEMPTS) {
      current.lockUntil = now + LOCKOUT_MS;
    }
    failedAdminAttempts.set(clientIp, current);

    throw new UnauthorizedException(
      'Acceso denegado: Credencial administrativa inválida o ausente (x-admin-key requerida).',
    );
  }
}
