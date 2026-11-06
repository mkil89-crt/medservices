/**
 * Script de création directe d'un compte Administrateur MedServices en base de données.
 * Conformément aux spécifications : le compte administrateur n'est JAMAIS créé par l'inscription publique.
 * 
 * Utilisation :
 * npx tsx scripts/create-admin.ts <email> <password> [nom_complet] [telephone]
 * 
 * Exemple :
 * npx tsx scripts/create-admin.ts fondateur@medservices.ma MonMotDePasseSecret2026! "Dr. Fondateur MedServices" "+212661123456"
 */

import crypto from 'node:crypto';
import { db, initDatabase, hashPassword, generateSalt } from '../server/db.js';

// Initialize DB schema if not already present
initDatabase();

const args = process.argv.slice(2);
const email = args[0] || 'abdelhaqcherqui@gmail.com';
const password = args[1] || 'MedServices2026!';
const fullName = args[2] || 'Abdelhaq Cherqui (Fondateur)';
const phone = args[3] || '+212600000000';

const normalizedEmail = email.trim().toLowerCase();

const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(normalizedEmail) as any;

const salt = generateSalt();
const passwordHash = hashPassword(password, salt);
const now = new Date().toISOString();

if (existing) {
  // Update existing admin password and role
  db.prepare(`
    UPDATE users 
    SET role = 'admin', full_name = ?, phone_whatsapp = ?, password_hash = ?, password_salt = ?, updated_at = ?
    WHERE id = ?
  `).run(fullName, phone, passwordHash, salt, now, existing.id);

  console.log(`✅ Compte Administrateur mis à jour avec succès :`);
  console.log(`   E-mail   : ${normalizedEmail}`);
  console.log(`   Rôle     : admin`);
  console.log(`   Nom      : ${fullName}`);
} else {
  // Insert new admin
  const adminId = 'admin-' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (
      id, role, full_name, specialty, structure_type, structure_name, 
      city, phone_whatsapp, email, password_hash, password_salt, cgu_accepted, created_at, updated_at
    ) VALUES (?, 'admin', ?, 'Administration', 'Direction MedServices', 'Siège MedServices', 'Casablanca', ?, ?, ?, ?, 1, ?, ?)
  `).run(
    adminId,
    fullName,
    phone,
    normalizedEmail,
    passwordHash,
    salt,
    now,
    now
  );

  console.log(`✅ Compte Administrateur créé directement dans la base de données :`);
  console.log(`   ID       : ${adminId}`);
  console.log(`   E-mail   : ${normalizedEmail}`);
  console.log(`   Rôle     : admin`);
  console.log(`   Nom      : ${fullName}`);
}
