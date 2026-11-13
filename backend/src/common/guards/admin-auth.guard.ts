import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { createVerify, timingSafeEqual } from 'crypto';
import axios from 'axios';

// Registro en memoria de intentos fallidos de acceso administrativo por IP (Anti-Fuerza Bruta)
const failedAdminAttempts = new Map<string, { count: number; lockUntil: number }>();
const MAX_FAILED_ATTEMPTS = 10;
const LOCKOUT_MS = 5 * 60 * 1000;

const GOOGLE_CERTS_URL =
  'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let cachedGoogleCerts: { keys: Record<string, string>; expiresAt: number } | null = null;
const verifiedAdminRoleCache = new Map<string, { isAdmin: boolean; expiresAt: number }>();

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }

  private decodeBase64UrlJson(segment: string): any {
    const json = Buffer.from(segment, 'base64url').toString('utf8');
    return JSON.parse(json);
  }

  private async getGooglePublicCerts(): Promise<Record<string, string>> {
    const now = Date.now();
    if (cachedGoogleCerts && now < cachedGoogleCerts.expiresAt) {
      return cachedGoogleCerts.keys;
    }
    const res = await axios.get<Record<string, string>>(GOOGLE_CERTS_URL, { timeout: 5000 });
    cachedGoogleCerts = {
      keys: res.data || {},
      expiresAt: now + 50 * 60 * 1000,
    };
    return cachedGoogleCerts.keys;
  }

  private async verifyFirebaseAdminToken(token: string): Promise<boolean> {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    try {
      const header = this.decodeBase64UrlJson(parts[0]);
      const payload = this.decodeBase64UrlJson(parts[1]);
      if (header?.alg !== 'RS256' || !header?.kid || !payload?.sub) {
        return false;
      }

      const projectId = process.env.FIREBASE_PROJECT_ID || 'kuroapp-62618';
      const nowSec = Math.floor(Date.now() / 1000);
      if (
        payload.aud !== projectId ||
        payload.iss !== `https://securetoken.google.com/${projectId}` ||
        typeof payload.exp !== 'number' ||
        payload.exp < nowSec - 30
      ) {
        return false;
      }

      const certs = await this.getGooglePublicCerts();
      const certPem = certs[header.kid];
      if (!certPem) return false;

      const verifier = createVerify('RSA-SHA256');
      verifier.update(`${parts[0]}.${parts[1]}`);
      verifier.end();
      const signatureValid = verifier.verify(certPem, Buffer.from(parts[2], 'base64url'));
      if (!signatureValid) return false;

      // 1. Custom Claim directo en el token
      if (payload.role === 'admin' || payload.admin === true) {
        return true;
      }

      // 2. Lista blanca de correos administradores con email verificado
      const allowedEmails = (
        process.env.ADMIN_EMAILS || 'juanque.ovalle@gmail.com,admin@kuropunk.co'
      )
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

      if (
        payload.email_verified === true &&
        typeof payload.email === 'string' &&
        allowedEmails.includes(payload.email.trim().toLowerCase())
      ) {
        return true;
      }

      // 3. Verificación del documento users/{uid}.role === 'admin' en Firestore
      const uid = String(payload.sub);
      const cachedRole = verifiedAdminRoleCache.get(uid);
      if (cachedRole && Date.now() < cachedRole.expiresAt) {
        return cachedRole.isAdmin;
      }

      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
        projectId,
      )}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
      const docRes = await axios.get(firestoreUrl, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 4000,
      });
      const isFirestoreAdmin = docRes.data?.fields?.role?.stringValue === 'admin';
      verifiedAdminRoleCache.set(uid, {
        isAdmin: isFirestoreAdmin,
        expiresAt: Date.now() + 5 * 60 * 1000,
      });
      return isFirestoreAdmin;
    } catch {
      return false;
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const clientIp =
      request.ip ||
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

    // 1. Validar Firebase ID Token (Authorization: Bearer <jwt>)
    const authHeader = request.headers['authorization'];
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token.split('.').length === 3 && (await this.verifyFirebaseAdminToken(token))) {
        failedAdminAttempts.delete(clientIp);
        return true;
      }
    }

    // 2. Validar ADMIN_SECRET_KEY de servidor si fue configurada explícitamente por entorno (sin fallback en código)
    const configuredKey = (process.env.ADMIN_SECRET_KEY || '').trim();
    if (configuredKey.length >= 16) {
      const adminKey = request.headers['x-admin-key'];
      if (typeof adminKey === 'string' && this.safeCompare(adminKey.trim(), configuredKey)) {
        failedAdminAttempts.delete(clientIp);
        return true;
      }
      if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        if (this.safeCompare(token, configuredKey)) {
          failedAdminAttempts.delete(clientIp);
          return true;
        }
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
      'Acceso denegado: Se requiere sesión activa de Administrador verificada en Firebase.',
    );
  }
}
