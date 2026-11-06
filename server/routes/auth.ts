import { Router } from 'express';
import crypto from 'node:crypto';
import { db, hashPassword, generateSalt } from '../db.js';
import {
  createSession,
  deleteSession,
  checkRateLimit,
  recordFailedLogin,
  resetRateLimit,
  requireAuth,
  requireAdmin,
  type RequestWithUser,
} from '../auth.js';

export const authRouter = Router();

// Administrator (Founder) Login
authRouter.post('/login', (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { isLocked, remainingSeconds } = checkRateLimit(ip);

  if (isLocked) {
    return res.status(429).json({
      error: `Trop de tentatives de connexion échouées. Par sécurité, votre accès est temporairement suspendu pour ${remainingSeconds} secondes.`,
    });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Veuillez renseigner votre Gmail / e-mail et votre mot de passe.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = db.prepare(`
    SELECT id, role, full_name, specialty, structure_type, structure_name, city, phone_whatsapp, email, password_hash, password_salt
    FROM users
    WHERE email = ? AND role = 'admin'
  `).get(normalizedEmail) as any;

  if (!user) {
    recordFailedLogin(ip);
    return res.status(401).json({ error: 'Identifiants administrateur incorrects.' });
  }

  const calculatedHash = hashPassword(password, user.password_salt);
  if (calculatedHash !== user.password_hash) {
    recordFailedLogin(ip);
    return res.status(401).json({ error: 'Identifiants administrateur incorrects.' });
  }

  // Successful login: reset rate limit attempts
  resetRateLimit(ip);

  const token = createSession(user.id, user.role);

  return res.json({
    message: 'Connexion administrateur réussie.',
    token,
    user: {
      id: user.id,
      role: user.role,
      full_name: user.full_name,
      specialty: user.specialty,
      structure_type: user.structure_type,
      structure_name: user.structure_name,
      city: user.city,
      phone_whatsapp: user.phone_whatsapp,
      email: user.email,
    },
  });
});

// Current User Me (Admin)
authRouter.get('/me', requireAuth, (req: RequestWithUser, res) => {
  return res.json({ user: req.user });
});

// Update Founder Credentials (Gmail, Mot de passe, Nom, Téléphone)
authRouter.put('/profile', requireAdmin, (req: RequestWithUser, res) => {
  const adminId = req.user!.id;
  const { full_name, email, phone_whatsapp, new_password, current_password } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Une adresse Gmail ou e-mail valide est obligatoire.' });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if another user already has this email
  const existing = db.prepare(`SELECT id FROM users WHERE email = ? AND id != ?`).get(normalizedEmail, adminId) as any;
  if (existing) {
    return res.status(400).json({ error: 'Cette adresse e-mail est déjà utilisée par un autre compte.' });
  }

  const currentUser = db.prepare(`SELECT * FROM users WHERE id = ?`).get(adminId) as any;
  if (!currentUser) {
    return res.status(404).json({ error: 'Compte administrateur introuvable.' });
  }

  let newHash = currentUser.password_hash;
  let newSalt = currentUser.password_salt;

  if (new_password) {
    if (new_password.length < 8) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit comporter au moins 8 caractères.' });
    }

    if (current_password) {
      const checkHash = hashPassword(current_password, currentUser.password_salt);
      if (checkHash !== currentUser.password_hash) {
        return res.status(400).json({ error: 'Le mot de passe actuel est incorrect.' });
      }
    }

    newSalt = generateSalt();
    newHash = hashPassword(new_password, newSalt);
  }

  const updatedName = full_name?.trim() || currentUser.full_name;
  const updatedPhone = phone_whatsapp?.trim() || currentUser.phone_whatsapp;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE users
    SET full_name = ?, email = ?, phone_whatsapp = ?, password_hash = ?, password_salt = ?, updated_at = ?
    WHERE id = ?
  `).run(
    updatedName,
    normalizedEmail,
    updatedPhone,
    newHash,
    newSalt,
    now,
    adminId
  );

  return res.json({
    message: 'Profil administrateur et identifiants mis à jour avec succès.',
    user: {
      id: adminId,
      role: 'admin',
      full_name: updatedName,
      email: normalizedEmail,
      phone_whatsapp: updatedPhone,
    },
  });
});

// Logout
authRouter.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (token) {
    deleteSession(token);
  }
  return res.json({ message: 'Déconnexion effectuée.' });
});
