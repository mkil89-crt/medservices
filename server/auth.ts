import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import { db, hashPassword } from './db.js';

export interface AuthenticatedUser {
  id: string;
  role: 'doctor' | 'admin';
  full_name: string;
  specialty?: string | null;
  structure_type?: string | null;
  structure_name?: string | null;
  city?: string | null;
  phone_whatsapp?: string | null;
  email: string;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Rate limiting configurations for brute-force protection
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { isLocked: boolean; remainingSeconds?: number } {
  const now = Date.now();
  const row = db.prepare(`SELECT attempts, locked_until FROM auth_rate_limits WHERE ip = ?`).get(ip) as { attempts: number; locked_until: number } | undefined;

  if (row && row.locked_until > now) {
    const remainingSeconds = Math.ceil((row.locked_until - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  return { isLocked: false };
}

export function recordFailedLogin(ip: string) {
  const now = Date.now();
  const row = db.prepare(`SELECT attempts FROM auth_rate_limits WHERE ip = ?`).get(ip) as { attempts: number } | undefined;
  const attempts = (row ? row.attempts : 0) + 1;
  const locked_until = attempts >= MAX_FAILED_ATTEMPTS ? now + LOCKOUT_DURATION_MS : 0;

  db.prepare(`
    INSERT INTO auth_rate_limits (ip, attempts, locked_until)
    VALUES (?, ?, ?)
    ON CONFLICT(ip) DO UPDATE SET attempts = ?, locked_until = ?
  `).run(ip, attempts, locked_until, attempts, locked_until);
}

export function resetRateLimit(ip: string) {
  db.prepare(`DELETE FROM auth_rate_limits WHERE ip = ?`).run(ip);
}

export function createSession(userId: string, role: 'doctor' | 'admin'): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sessions (token, user_id, role, expires_at, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(token, userId, role, expiresAt, now);

  return token;
}

export function deleteSession(token: string) {
  db.prepare(`DELETE FROM sessions WHERE token = ?`).run(token);
}

export function getSessionUser(token: string): AuthenticatedUser | null {
  const now = Date.now();
  const session = db.prepare(`
    SELECT s.user_id, s.role, s.expires_at, u.full_name, u.specialty, u.structure_type, u.structure_name, u.city, u.phone_whatsapp, u.email
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, now) as (AuthenticatedUser & { user_id: string; expires_at: number }) | undefined;

  if (!session) return null;

  return {
    id: session.user_id,
    role: session.role,
    full_name: session.full_name,
    specialty: session.specialty,
    structure_type: session.structure_type,
    structure_name: session.structure_name,
    city: session.city,
    phone_whatsapp: session.phone_whatsapp,
    email: session.email,
  };
}

// Middleware: Require valid session token
export function requireAuth(req: RequestWithUser, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.cookies?.medservices_session || req.headers['x-session-token']);

  if (!token || typeof token !== 'string') {
    return res.status(401).json({ error: 'Session non authentifiée. Veuillez vous connecter.' });
  }

  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Session expirée ou invalide. Veuillez vous reconnecter.' });
  }

  req.user = user;
  next();
}

// Middleware: Require Doctor role
export function requireDoctor(req: RequestWithUser, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'doctor') {
      return res.status(403).json({ error: 'Accès réservé aux professionnels de santé inscrits.' });
    }
    next();
  });
}

// Middleware: Require Admin role (protected strictly on server side)
export function requireAdmin(req: RequestWithUser, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Accès interdit. Droits d’administration requis.' });
    }
    next();
  });
}

// Audit logger for administrative actions
export function logAdminAction(params: {
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any>;
}) {
  const id = 'audit-' + crypto.randomUUID();
  const now = new Date().toISOString();

  try {
    db.prepare(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_name, action, target_type, target_id, details_json, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.adminId,
      params.adminName,
      params.action,
      params.targetType,
      params.targetId || null,
      params.details ? JSON.stringify(params.details) : null,
      now
    );
  } catch (err) {
    console.error('[Audit Log] Erreur écriture:', err);
  }
}
